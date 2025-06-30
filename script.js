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
            applySavedSettings(); // Aplica as configurações salvas (tema e fonte)
        } catch (error) {
            console.error('Erro ao carregar os dados da Bíblia:', error);
            bibleContent.innerHTML = `<p class="error-message">Erro ao carregar a Bíblia. Por favor, tente novamente mais tarde.</p>`;
        } finally {
            loadingIndicator.style.display = 'none'; // Esconde o spinner
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

    function populateChapterSelect(bookIndex) {
        chapterSelect.innerHTML = '<option value="">Selecione um capítulo</option>';
        if (bookIndex !== null && bibleData[bookIndex]) {
            const numChapters = bibleData[bookIndex].chapters.length;
            for (let i = 1; i <= numChapters; i++) {
                const option = document.createElement('option');
                option.value = i - 1; // Índices baseados em 0
                option.textContent = `Capítulo ${i}`;
                chapterSelect.appendChild(option);
            }
            chapterSelect.disabled = false;
        } else {
            chapterSelect.disabled = true;
        }
    }

    function displayChapter(bookIndex, chapterIndex) {
        if (bookIndex !== null && chapterIndex !== null && bibleData[bookIndex] && bibleData[bookIndex].chapters[chapterIndex]) {
            const chapterVerses = bibleData[bookIndex].chapters[chapterIndex];
            let contentHtml = `<h2 class="chapter-title">${bibleData[bookIndex].abbrev} - Capítulo ${chapterIndex + 1}</h2>`;
            chapterVerses.forEach((verse, verseIndex) => {
                const verseId = `${bookIndex}-${chapterIndex}-${verseIndex}`;
                const isHighlighted = highlights.has(verseId);
                contentHtml += `<p class="verse ${isHighlighted ? 'highlighted' : ''}" data-verse-id="${verseId}">
                                    <span class="verse-number">${verseIndex + 1}.</span> ${verse}
                                </p>`;
            });
            bibleContent.innerHTML = contentHtml;
            updateChapterNavigationButtons();
            clearHighlightsBtn.style.display = 'block'; // Mostra o botão de limpar destaques
            saveLastReadChapter(bookIndex, chapterIndex);
        } else {
            bibleContent.innerHTML = `<p class="initial-message">Selecione um livro e um capítulo para começar a ler.</p>`;
            clearHighlightsBtn.style.display = 'none'; // Esconde o botão se não há capítulo
            prevChapterBtn.disabled = true;
            nextChapterBtn.disabled = true;
        }
    }

    function saveLastReadChapter(bookIndex, chapterIndex) {
        localStorage.setItem(LAST_READ_KEY, JSON.stringify({ book: bookIndex, chapter: chapterIndex }));
    }

    function loadLastReadChapter() {
        const lastRead = JSON.parse(localStorage.getItem(LAST_READ_KEY));
        if (lastRead && lastRead.book !== undefined && lastRead.chapter !== undefined) {
            currentBookIndex = lastRead.book;
            currentChapterIndex = lastRead.chapter;

            bookSelect.value = currentBookIndex;
            populateChapterSelect(currentBookIndex);
            chapterSelect.value = currentChapterIndex;
            displayChapter(currentBookIndex, currentChapterIndex);
            lastReadInfo.textContent = `Última leitura: ${bibleData[currentBookIndex].abbrev} - Capítulo ${currentChapterIndex + 1}`;
        } else {
            lastReadInfo.textContent = 'Nenhuma leitura anterior encontrada.';
        }
    }

    function updateChapterNavigationButtons() {
        const currentBook = bibleData[currentBookIndex];
        const hasNextChapter = currentChapterIndex < currentBook.chapters.length - 1;
        const hasPrevChapter = currentChapterIndex > 0;
        const hasNextBook = currentBookIndex < bibleData.length - 1;
        const hasPrevBook = currentBookIndex > 0;

        nextChapterBtn.disabled = !hasNextChapter && !hasNextBook;
        prevChapterBtn.disabled = !hasPrevChapter && !hasPrevBook;
    }

    // --- Event Listeners ---

    bookSelect.addEventListener('change', (event) => {
        currentBookIndex = parseInt(event.target.value);
        currentChapterIndex = null; // Reseta o capítulo ao mudar de livro
        populateChapterSelect(currentBookIndex);
        displayChapter(currentBookIndex, currentChapterIndex); // Exibe mensagem inicial
    });

    chapterSelect.addEventListener('change', (event) => {
        currentChapterIndex = parseInt(event.target.value);
        displayChapter(currentBookIndex, currentChapterIndex);
    });

    bibleContent.addEventListener('click', (event) => {
        const verseElement = event.target.closest('.verse');
        if (verseElement) {
            const verseId = verseElement.dataset.verseId;
            if (highlights.has(verseId)) {
                highlights.delete(verseId);
                verseElement.classList.remove('highlighted');
            } else {
                highlights.add(verseId);
                verseElement.classList.add('highlighted');
            }
            localStorage.setItem('bibleHighlightsSet', JSON.stringify(Array.from(highlights)));
        }
    });

    clearHighlightsBtn.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja remover todos os destaques deste capítulo?')) {
            const verseElements = bibleContent.querySelectorAll('.verse.highlighted');
            verseElements.forEach(verseElement => {
                const verseId = verseElement.dataset.verseId;
                highlights.delete(verseId);
                verseElement.classList.remove('highlighted');
            });
            localStorage.setItem('bibleHighlightsSet', JSON.stringify(Array.from(highlights)));
        }
    });

    prevChapterBtn.addEventListener('click', () => {
        if (currentBookIndex !== null && currentChapterIndex !== null) {
            if (currentChapterIndex > 0) {
                currentChapterIndex--;
            } else if (currentBookIndex > 0) {
                currentBookIndex--;
                currentChapterIndex = bibleData[currentBookIndex].chapters.length - 1;
            }
            bookSelect.value = currentBookIndex;
            populateChapterSelect(currentBookIndex);
            chapterSelect.value = currentChapterIndex;
            displayChapter(currentBookIndex, currentChapterIndex);
        }
    });

    nextChapterBtn.addEventListener('click', () => {
        if (currentBookIndex !== null && currentChapterIndex !== null) {
            const currentBook = bibleData[currentBookIndex];
            if (currentChapterIndex < currentBook.chapters.length - 1) {
                currentChapterIndex++;
            } else if (currentBookIndex < bibleData.length - 1) {
                currentBookIndex++;
                currentChapterIndex = 0; // Vai para o primeiro capítulo do próximo livro
            }
            bookSelect.value = currentBookIndex;
            populateChapterSelect(currentBookIndex);
            chapterSelect.value = currentChapterIndex;
            displayChapter(currentBookIndex, currentChapterIndex);
        }
    });

    // --- Tema e Tamanho da Fonte ---

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

    // --- Inicialização ---
    loadBibleData();
});