document.addEventListener('DOMContentLoaded', () => {
    const bookSelect = document.getElementById('book-select');
    const chapterSelect = document.getElementById('chapter-select');
    const bibleContent = document.getElementById('bible-content');
    const lastReadInfo = document.getElementById('last-read-info'); // Novo elemento
    const clearHighlightsBtn = document.getElementById('clear-highlights-btn'); // Novo botão
    let bibleData = []; // Variável para armazenar os dados da Bíblia
    let currentBookIndex = null;
    let currentChapterIndex = null;
    let highlights = JSON.parse(localStorage.getItem('bibleHighlights')) || {}; // Carrega destaques salvos

    // Chave para armazenar a última leitura no localStorage
    const LAST_READ_KEY = 'lastReadBibleChapter';

    // Função para carregar os dados da Bíblia
    async function loadBibleData() {
        try {
            const response = await fetch('biblia.json');
            if (!response.ok) {
                throw new Error(`Erro ao carregar biblia.json: ${response.statusText}`);
            }
            bibleData = await response.json();
            populateBookSelect();
            loadLastReadChapter(); // Tenta carregar a última leitura após carregar os dados
        } catch (error) {
            console.error('Falha ao carregar os dados da Bíblia:', error);
            bibleContent.innerHTML = '<p class="error-message">Não foi possível carregar a Bíblia. Por favor, tente novamente mais tarde.</p>';
        }
    }

    // Função para preencher o dropdown de livros
    function populateBookSelect() {
        bookSelect.innerHTML = '<option value="">Selecione um livro</option>';
        bibleData.forEach((book, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = book.abbrev;
            bookSelect.appendChild(option);
        });
    }

    // Função para salvar a última leitura no localStorage
    function saveLastReadChapter(bookIndex, chapterIndex) {
        localStorage.setItem(LAST_READ_KEY, JSON.stringify({ book: bookIndex, chapter: chapterIndex }));
        updateLastReadInfo(bookIndex, chapterIndex); // Atualiza a exibição da última leitura
    }

    // Função para carregar a última leitura do localStorage
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
            updateLastReadInfo(currentBookIndex, currentChapterIndex); // Atualiza a info da última leitura
            lastReadInfo.style.display = 'block'; // Mostra a info da última leitura
        } else {
            lastReadInfo.innerHTML = '<p class="initial-message">Nenhuma leitura anterior encontrada.</p>';
            lastReadInfo.style.display = 'block'; // Mostra a mensagem inicial se não houver última leitura
        }
    }

    // Função para atualizar a informação da última leitura exibida
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

    // Event Listener para quando um livro é selecionado
    bookSelect.addEventListener('change', () => {
        currentBookIndex = bookSelect.value;
        chapterSelect.innerHTML = '<option value="">Selecione um capítulo</option>';
        bibleContent.innerHTML = '<p class="initial-message">Selecione um capítulo para começar a ler.</p>';
        clearHighlightsBtn.style.display = 'none'; // Esconde o botão de limpar destaques ao mudar de livro

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
            currentChapterIndex = null; // Limpa o capítulo atual
            updateLastReadInfo(null, null); // Limpa a informação da última leitura
            lastReadInfo.style.display = 'block'; // Garante que a mensagem "Nenhuma leitura anterior" apareça
        }
    });

    // Event Listener para quando um capítulo é selecionado
    chapterSelect.addEventListener('change', () => {
        currentChapterIndex = chapterSelect.value;
        if (currentBookIndex !== "" && currentChapterIndex !== "") {
            displayCurrentChapter();
            saveLastReadChapter(currentBookIndex, currentChapterIndex); // Salva a leitura atual
            clearHighlightsBtn.style.display = 'block'; // Mostra o botão de limpar destaques
        } else {
            bibleContent.innerHTML = '<p class="initial-message">Selecione um livro e um capítulo para começar a ler.</p>';
            clearHighlightsBtn.style.display = 'none'; // Esconde o botão se nenhum capítulo for selecionado
        }
    });

    // Função para exibir o conteúdo do capítulo
    function displayCurrentChapter() {
        if (currentBookIndex === null || currentChapterIndex === null) {
            bibleContent.innerHTML = '<p class="initial-message">Selecione um livro e um capítulo para começar a ler.</p>';
            return;
        }
        const book = bibleData[currentBookIndex];
        const chapter = book.chapters[currentChapterIndex];
        bibleContent.innerHTML = ''; // Limpa o conteúdo anterior

        const chapterHighlights = highlights[`${currentBookIndex}-${currentChapterIndex}`] || [];

        chapter.forEach((verse, index) => {
            const p = document.createElement('p');
            p.classList.add('verse'); // Adiciona uma classe para o versículo
            p.dataset.verseIndex = index; // Adiciona um atributo de dados para o índice do versículo
            p.innerHTML = `<span class="verse-number">${index + 1}.</span> ${verse}`;
            
            // Aplica os destaques salvos
            chapterHighlights.forEach(highlight => {
                if (highlight.verseIndex === index) {
                    const range = document.createRange();
                    const textNode = p.childNodes[1]; // O nó de texto é o segundo filho (após o span do número)
                    
                    if (textNode && textNode.nodeType === Node.TEXT_NODE && highlight.startOffset <= textNode.length && highlight.endOffset <= textNode.length) {
                        range.setStart(textNode, highlight.startOffset);
                        range.setEnd(textNode, highlight.endOffset);
                        const span = document.createElement('span');
                        span.classList.add('highlight');
                        range.surroundContents(span);
                    }
                }
            });
            bibleContent.appendChild(p);
        });
    }

    // Função para salvar os destaques no localStorage
    function saveHighlights() {
        localStorage.setItem('bibleHighlights', JSON.stringify(highlights));
    }

    // Event Listener para seleção de texto (destaque)
    bibleContent.addEventListener('mouseup', () => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText.length > 0 && currentBookIndex !== null && currentChapterIndex !== null) {
            const range = selection.getRangeAt(0);
            const parentVerse = range.commonAncestorContainer.closest('.verse');

            if (parentVerse) {
                const verseIndex = parseInt(parentVerse.dataset.verseIndex);
                const textNode = parentVerse.childNodes[1]; // O nó de texto após o número do versículo
                
                // Calcula os offsets relativos ao nó de texto do versículo
                const startOffset = range.startOffset - (textNode.compareDocumentPosition(range.startContainer) === Node.DOCUMENT_POSITION_PRECEDING ? range.startContainer.textContent.length : 0);
                const endOffset = range.endOffset - (textNode.compareDocumentPosition(range.endContainer) === Node.DOCUMENT_POSITION_PRECEDING ? range.endContainer.textContent.length : 0);

                const highlightKey = `${currentBookIndex}-${currentChapterIndex}`;
                if (!highlights[highlightKey]) {
                    highlights[highlightKey] = [];
                }
                highlights[highlightKey].push({
                    verseIndex: verseIndex,
                    startOffset: Math.max(0, startOffset), // Garante que não seja negativo
                    endOffset: Math.min(textNode.length, endOffset) // Garante que não exceda o comprimento
                });
                saveHighlights();
                displayCurrentChapter(); // Redesenha para aplicar o destaque
            }
        }
    });

    // Event Listener para limpar todos os destaques do capítulo atual
    clearHighlightsBtn.addEventListener('click', () => {
        if (currentBookIndex !== null && currentChapterIndex !== null) {
            const highlightKey = `${currentBookIndex}-${currentChapterIndex}`;
            if (highlights[highlightKey]) {
                delete highlights[highlightKey]; // Remove os destaques do capítulo atual
                saveHighlights(); // Salva as mudanças
                displayCurrentChapter(); // Redesenha para remover os destaques
                alert('Destaques deste capítulo foram limpos!');
            } else {
                alert('Não há destaques para limpar neste capítulo.');
            }
        }
    });

    // Carrega os dados da Bíblia quando a página é carregada
    loadBibleData();
});