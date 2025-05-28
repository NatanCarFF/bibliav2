document.addEventListener('DOMContentLoaded', () => {
    const bookSelect = document.getElementById('book-select');
    const chapterSelect = document.getElementById('chapter-select');
    const bibleContent = document.getElementById('bible-content');
    const lastReadInfo = document.getElementById('last-read-info');
    const clearHighlightsBtn = document.getElementById('clear-highlights-btn');
    let bibleData = [];
    let currentBookIndex = null;
    let currentChapterIndex = null;
    
    // Agora 'highlights' armazenará um Set de strings "bookIndex-chapterIndex-verseIndex" para versículos marcados
    let highlights = new Set(JSON.parse(localStorage.getItem('bibleHighlightsSet')) || []); 

    const LAST_READ_KEY = 'lastReadBibleChapter';

    // --- Funções de Carregamento da Bíblia e Última Leitura ---

    async function loadBibleData() {
        try {
            const response = await fetch('biblia.json');
            if (!response.ok) {
                throw new Error(`Erro ao carregar biblia.json: ${response.statusText}`);
            }
            bibleData = await response.json();
            populateBookSelect();
            loadLastReadChapter();
        } catch (error) {
            console.error('Falha ao carregar os dados da Bíblia:', error);
            bibleContent.innerHTML = '<p class="error-message">Não foi possível carregar a Bíblia. Por favor, tente novamente mais tarde.</p>';
        }
    }

    function populateBookSelect() {
        bookSelect.innerHTML = '<option value="">Selecione um livro</option>';
        bibleData.forEach((book, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = book.abbrev;
            bookSelect.appendChild(option);
        });
    }

    function saveLastReadChapter(bookIndex, chapterIndex) {
        localStorage.setItem(LAST_READ_KEY, JSON.stringify({ book: bookIndex, chapter: chapterIndex }));
        updateLastReadInfo(bookIndex, chapterIndex);
    }

    function loadLastReadChapter() {
        const lastRead = JSON.parse(localStorage.getItem(LAST_READ_KEY));
        if (lastRead && bibleData[lastRead.book]) {
            currentBookIndex = lastRead.book;
            currentChapterIndex = lastRead.chapter;
            bookSelect.value = currentBookIndex;
            
            // Simula a seleção do livro para popular os capítulos
            const event = new Event('change');
            bookSelect.dispatchEvent(event);

            chapterSelect.value = currentChapterIndex;
            displayCurrentChapter(); // Exibe o capítulo diretamente
            updateLastReadInfo(currentBookIndex, currentChapterIndex);
            lastReadInfo.style.display = 'block';
        } else {
            lastReadInfo.innerHTML = '<p class="initial-message">Nenhuma leitura anterior encontrada.</p>';
            lastReadInfo.style.display = 'block';
        }
    }

    function updateLastReadInfo(bookIndex, chapterIndex) {
        if (bookIndex !== null && chapterIndex !== null && bibleData[bookIndex]) {
            const bookName = bibleData[bookIndex].name;
            const chapterNumber = parseInt(chapterIndex) + 1;
            lastReadInfo.innerHTML = `<p>Última leitura: <strong>${bookName} - Capítulo ${chapterNumber}</strong></p>`;
            lastReadInfo.style.display = 'block';
        } else {
            lastReadInfo.innerHTML = '<p class="initial-message">Nenhuma leitura anterior encontrada.</p>';
        }
    }

    // --- Event Listeners para Seleção de Livro/Capítulo ---

    bookSelect.addEventListener('change', () => {
        currentBookIndex = bookSelect.value;
        chapterSelect.innerHTML = '<option value="">Selecione um capítulo</option>';
        bibleContent.innerHTML = '<p class="initial-message">Selecione um capítulo para começar a ler.</p>';
        clearHighlightsBtn.style.display = 'none';

        if (currentBookIndex !== "") {
            const book = bibleData[currentBookIndex];
            for (let i = 0; i < book.chapters.length; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `Capítulo ${i + 1}`;
                chapterSelect.appendChild(option);
            }
            chapterSelect.disabled = false;
        } else {
            chapterSelect.disabled = true;
            currentChapterIndex = null;
            updateLastReadInfo(null, null);
            lastReadInfo.style.display = 'block';
        }
    });

    chapterSelect.addEventListener('change', () => {
        currentChapterIndex = chapterSelect.value;
        if (currentBookIndex !== "" && currentChapterIndex !== "") {
            displayCurrentChapter();
            saveLastReadChapter(currentBookIndex, currentChapterIndex);
            clearHighlightsBtn.style.display = 'block';
        } else {
            bibleContent.innerHTML = '<p class="initial-message">Selecione um livro e um capítulo para começar a ler.</p>';
            clearHighlightsBtn.style.display = 'none';
        }
    });

    // --- Nova Lógica de Destaque por Clique no Versículo ---

    function saveHighlights() {
        // Converte o Set de volta para um Array para salvar no localStorage
        localStorage.setItem('bibleHighlightsSet', JSON.stringify(Array.from(highlights)));
    }

    function displayCurrentChapter() {
        if (currentBookIndex === null || currentChapterIndex === null) {
            bibleContent.innerHTML = '<p class="initial-message">Selecione um livro e um capítulo para começar a ler.</p>';
            return;
        }
        const book = bibleData[currentBookIndex];
        const chapter = book.chapters[currentChapterIndex];
        bibleContent.innerHTML = '';

        chapter.forEach((verse, index) => {
            const p = document.createElement('p');
            p.classList.add('verse');
            p.dataset.verseIndex = index; // Adiciona um atributo de dados para o índice do versículo
            
            // Cria uma chave única para este versículo
            const verseKey = `${currentBookIndex}-${currentChapterIndex}-${index}`;

            // Verifica se este versículo está destacado
            if (highlights.has(verseKey)) {
                p.classList.add('highlighted-verse'); // Adiciona uma classe para versículos marcados
            }

            p.innerHTML = `<span class="verse-number">${index + 1}.</span> ${verse}`;
            bibleContent.appendChild(p);
        });
    }

    // Event Listener para clique em qualquer lugar dentro de bibleContent
    // Usaremos a delegação de eventos para capturar cliques nos versículos
    bibleContent.addEventListener('click', (event) => {
        const clickedVerse = event.target.closest('.verse'); // Encontra o elemento .verse pai
        
        if (clickedVerse && currentBookIndex !== null && currentChapterIndex !== null) {
            const verseIndex = parseInt(clickedVerse.dataset.verseIndex);
            const verseKey = `${currentBookIndex}-${currentChapterIndex}-${verseIndex}`;

            if (highlights.has(verseKey)) {
                // Se já estiver marcado, desmarca
                highlights.delete(verseKey);
            } else {
                // Se não estiver marcado, marca
                highlights.add(verseKey);
            }
            saveHighlights(); // Salva as alterações
            displayCurrentChapter(); // Redesenha para aplicar/remover o destaque
        }
    });

    // Event Listener para limpar todos os destaques do capítulo atual
    clearHighlightsBtn.addEventListener('click', () => {
        if (currentBookIndex !== null && currentChapterIndex !== null) {
            // Remove todos os destaques que pertencem ao capítulo atual
            highlights = new Set(Array.from(highlights).filter(key => {
                const parts = key.split('-');
                return !(parts[0] === currentBookIndex && parts[1] === currentChapterIndex);
            }));
            
            saveHighlights(); // Salva as mudanças
            displayCurrentChapter(); // Redesenha para remover os destaques
            alert('Destaques deste capítulo foram limpos!');
        }
    });

    loadBibleData();
});