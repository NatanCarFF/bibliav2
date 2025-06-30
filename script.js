document.addEventListener('DOMContentLoaded', () => {
    const bookSelect = document.getElementById('book-select');
    const chapterSelect = document.getElementById('chapter-select');
    const bibleContent = document.getElementById('bible-content');
    const lastReadInfo = document.getElementById('last-read-info');
    const clearHighlightsBtn = document.getElementById('clear-highlights-btn');
    const prevChapterBtn = document.getElementById('prev-chapter-btn');
    const nextChapterBtn = document.getElementById('next-chapter-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const fontSizeSelect = document.getElementById('font-size-select');
    const loadingIndicator = document.getElementById('loading-indicator');

    let bibleData = [];
    let currentBookIndex = null;
    let currentChapterIndex = null;

    let highlights = new Set(JSON.parse(localStorage.getItem('bibleHighlightsSet')) || []);

    const LAST_READ_KEY = 'lastReadBibleChapter';
    const THEME_KEY = 'bibleAppTheme';
    const FONT_SIZE_KEY = 'bibleAppFontSize';

    // --- Funções de Carregamento da Bíblia e Última Leitura ---

    async function loadBibleData() {
        loadingIndicator.style.display = 'flex'; // Mostra o spinner
        try {
            const response = await fetch('biblia.json');
            if (!response.ok) {
                throw new Error(`Erro ao carregar biblia.json: ${response.statusText}`);
            }
            bibleData = await response.json();
            populateBookSelect();
            loadLastReadChapter();
            applySavedSettings(); // Aplica tema e tamanho da fonte salvos
        } catch (error) {
            console.error('Falha ao carregar os dados da Bíblia:', error);
            bibleContent.innerHTML = '<p class="error-message">Não foi possível carregar a Bíblia. Por favor, tente novamente mais tarde.</p>';
        } finally {
            loadingIndicator.style.display = 'none'; // Esconde o spinner
        }
    }

    function populateBookSelect() {
        bookSelect.innerHTML = '<option value="">Selecione um livro</option>';
        bibleData.forEach((book, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = book.name; // Usar book.name para o nome completo
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

            // Popula os capítulos para o livro da última leitura
            populateChapterSelect(currentBookIndex);
            chapterSelect.value = currentChapterIndex;

            displayCurrentChapter();
            updateLastReadInfo(currentBookIndex, currentChapterIndex);
            lastReadInfo.style.display = 'block';
        } else {
            lastReadInfo.innerHTML = '<p class="initial-message">Nenhuma leitura anterior encontrada.</p>';
            lastReadInfo.style.display = 'block';
        }
    }

    function updateLastReadInfo(bookIndex, chapterIndex) {
        if (bookIndex !== null && chapterIndex !== null && bibleData[bookIndex]) {
            // Certifique-se de que bookName usa bibleData[bookIndex].name
            const bookName = bibleData[bookIndex].name;
            const chapterNumber = parseInt(chapterIndex) + 1;
            lastReadInfo.innerHTML = `<p>Última leitura: <strong>${bookName} - Capítulo ${chapterNumber}</strong></p>`;
            lastReadInfo.style.display = 'block';
        } else {
            lastReadInfo.innerHTML = '<p class="initial-message">Nenhuma leitura anterior encontrada.</p>';
        }
    }

    // Função auxiliar para popular o select de capítulos
    function populateChapterSelect(bookIndex) {
        chapterSelect.innerHTML = '<option value="">Selecione um capítulo</option>';
        if (bookIndex !== null && bibleData[bookIndex]) {
            const book = bibleData[bookIndex];
            for (let i = 0; i < book.chapters.length; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `Capítulo ${i + 1}`;
                chapterSelect.appendChild(option);
            }
            chapterSelect.disabled = false;
        } else {
            chapterSelect.disabled = true;
        }
    }

    // --- Event Listeners para Seleção de Livro/Capítulo ---

    bookSelect.addEventListener('change', () => {
        currentBookIndex = bookSelect.value === "" ? null : parseInt(bookSelect.value);
        currentChapterIndex = null; // Reseta o capítulo ao mudar o livro

        populateChapterSelect(currentBookIndex);

        bibleContent.innerHTML = '<p class="initial-message">Selecione um capítulo para começar a ler.</p>';
        clearHighlightsBtn.style.display = 'none';
        prevChapterBtn.disabled = true;
        nextChapterBtn.disabled = true;

        updateLastReadInfo(null, null); // Limpa info da última leitura se nenhum livro estiver selecionado
    });

    chapterSelect.addEventListener('change', () => {
        currentChapterIndex = chapterSelect.value === "" ? null : parseInt(chapterSelect.value);
        if (currentBookIndex !== null && currentChapterIndex !== null) {
            displayCurrentChapter();
            saveLastReadChapter(currentBookIndex, currentChapterIndex);
            clearHighlightsBtn.style.display = 'block';
        } else {
            bibleContent.innerHTML = '<p class="initial-message">Selecione um livro e um capítulo para começar a ler.</p>';
            clearHighlightsBtn.style.display = 'none';
        }
        updateChapterNavigationButtons(); // Atualiza estado dos botões de navegação
    });

    // --- Nova Lógica de Destaque por Clique no Versículo ---

    function saveHighlights() {
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
            p.dataset.verseIndex = index;
            p.dataset.bookIndex = currentBookIndex;
            p.dataset.chapterIndex = currentChapterIndex;

            const verseKey = `${currentBookIndex}-${currentChapterIndex}-${index}`;

            if (highlights.has(verseKey)) {
                p.classList.add('highlighted-verse');
            }

            p.innerHTML = `<span class="verse-number">${index + 1}.</span> ${verse}`;
            bibleContent.appendChild(p);
        });
        updateChapterNavigationButtons(); // Atualiza estado dos botões de navegação
    }

    bibleContent.addEventListener('click', (event) => {
        const clickedVerse = event.target.closest('.verse');

        if (clickedVerse && currentBookIndex !== null && currentChapterIndex !== null) {
            const verseIndex = parseInt(clickedVerse.dataset.verseIndex);
            const verseKey = `${currentBookIndex}-${currentChapterIndex}-${verseIndex}`;

            if (highlights.has(verseKey)) {
                highlights.delete(verseKey);
            } else {
                highlights.add(verseKey);
            }
            saveHighlights();
            clickedVerse.classList.toggle('highlighted-verse'); // Alterna a classe diretamente
        }
    });

    clearHighlightsBtn.addEventListener('click', () => {
        if (currentBookIndex !== null && currentChapterIndex !== null) {
            if (confirm('Tem certeza que deseja limpar TODOS os destaques deste capítulo?')) {
                highlights = new Set(Array.from(highlights).filter(key => {
                    const parts = key.split('-');
                    return !(parseInt(parts[0]) === currentBookIndex && parseInt(parts[1]) === currentChapterIndex);
                }));

                saveHighlights();
                displayCurrentChapter();
                alert('Destaques deste capítulo foram limpos!');
            }
        }
    });

    // --- Navegação entre Capítulos (Próximo/Anterior) ---

    function updateChapterNavigationButtons() {
        if (currentBookIndex === null || currentChapterIndex === null || bibleData.length === 0) {
            prevChapterBtn.disabled = true;
            nextChapterBtn.disabled = true;
            return;
        }

        const currentBook = bibleData[currentBookIndex];
        const totalChaptersInBook = currentBook.chapters.length;
        const totalBooks = bibleData.length;

        // Habilita/Desabilita botão "Anterior"
        if (currentChapterIndex > 0) {
            prevChapterBtn.disabled = false;
        } else if (currentBookIndex > 0) {
            prevChapterBtn.disabled = false; // Há um livro anterior
        } else {
            prevChapterBtn.disabled = true;
        }

        // Habilita/Desabilita botão "Próximo"
        if (currentChapterIndex < totalChaptersInBook - 1) {
            nextChapterBtn.disabled = false;
        } else if (currentBookIndex < totalBooks - 1) {
            nextChapterBtn.disabled = false; // Há um livro próximo
        } else {
            nextChapterBtn.disabled = true;
        }
    }

    prevChapterBtn.addEventListener('click', () => {
        if (currentBookIndex === null || currentChapterIndex === null) return;

        if (currentChapterIndex > 0) {
            currentChapterIndex--;
        } else if (currentBookIndex > 0) {
            currentBookIndex--;
            currentChapterIndex = bibleData[currentBookIndex].chapters.length - 1; // Último capítulo do livro anterior
        } else {
            return; // Não há capítulo anterior
        }

        bookSelect.value = currentBookIndex;
        populateChapterSelect(currentBookIndex); // Popula capítulos do novo livro, se for o caso
        chapterSelect.value = currentChapterIndex;
        displayCurrentChapter();
        saveLastReadChapter(currentBookIndex, currentChapterIndex);
        updateChapterNavigationButtons();
    });

    nextChapterBtn.addEventListener('click', () => {
        if (currentBookIndex === null || currentChapterIndex === null) return;

        const currentBook = bibleData[currentBookIndex];
        if (currentChapterIndex < currentBook.chapters.length - 1) {
            currentChapterIndex++;
        } else if (currentBookIndex < bibleData.length - 1) {
            currentBookIndex++;
            currentChapterIndex = 0; // Primeiro capítulo do próximo livro
        } else {
            return; // Não há capítulo próximo
        }

        bookSelect.value = currentBookIndex;
        populateChapterSelect(currentBookIndex); // Popula capítulos do novo livro, se for o caso
        chapterSelect.value = currentChapterIndex;
        displayCurrentChapter();
        saveLastReadChapter(currentBookIndex, currentChapterIndex);
        updateChapterNavigationButtons();
    });


    // --- Configurações de Tema e Tamanho da Fonte ---

    function applySavedSettings() {
        // Aplica Tema
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggleBtn.textContent = 'Modo Claro';
        } else {
            document.body.classList.remove('dark-mode');
            themeToggleBtn.textContent = 'Modo Escuro';
        }

        // Aplica Tamanho da Fonte
        const savedFontSize = localStorage.getItem(FONT_SIZE_KEY);
        if (savedFontSize) {
            document.documentElement.style.setProperty('--base-font-size', `${savedFontSize}rem`);
            fontSizeSelect.value = savedFontSize;
        }
    }

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem(THEME_KEY, 'dark');
            themeToggleBtn.textContent = 'Modo Claro';
        } else {
            localStorage.setItem(THEME_KEY, 'light');
            themeToggleBtn.textContent = 'Modo Escuro';
        }
    });

    fontSizeSelect.addEventListener('change', () => {
        const newFontSize = fontSizeSelect.value;
        document.documentElement.style.setProperty('--base-font-size', `${newFontSize}rem`);
        localStorage.setItem(FONT_SIZE_KEY, newFontSize);
    });

    // Inicializa o aplicativo
    loadBibleData();
});