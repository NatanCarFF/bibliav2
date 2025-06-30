document.addEventListener('DOMContentLoaded', () => {
    const bookSelect = document.getElementById('book-select');
    const chapterSelect = document.getElementById('chapter-select');
    const bibleContent = document.getElementById('bible-content');
    const lastReadInfo = document.getElementById('last-read-info');
    // const clearHighlightsBtn = document.getElementById('clear-highlights-btn'); // Removido
    const prevChapterBtn = document.getElementById('prev-chapter-btn');
    const nextChapterBtn = document.getElementById('next-chapter-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const fontSizeSelect = document.getElementById('font-size-select'); // Keep this for storing value
    const decreaseFontSizeBtn = document.getElementById('decrease-font-size-btn');
    const increaseFontSizeBtn = document.getElementById('increase-font-size-btn');
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
            const data = await response.json();
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error("Dados da Bíblia inválidos ou vazios.");
            }
            bibleData = data; // Assign only after validation
            populateBookSelect();
            applySavedSettings(); // Apply settings after data is loaded
            checkLastReadChapter();
        } catch (error) {
            console.error('Erro ao carregar os dados da Bíblia:', error);
            bibleContent.innerHTML = `<p class="error-message">Erro ao carregar a Bíblia: ${error.message}. Tente novamente mais tarde.</p>`;
        } finally {
            loadingIndicator.style.display = 'none'; // Esconde o spinner
        }
    }

    function populateBookSelect() {
        bookSelect.innerHTML = '<option value="">Selecione um livro</option>';
        bibleData.forEach((book, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = book.name;
            bookSelect.appendChild(option);
        });
    }

    // --- Funções de Navegação e Carregamento de Capítulo ---

    bookSelect.addEventListener('change', () => {
        currentBookIndex = bookSelect.value === "" ? null : parseInt(bookSelect.value);
        currentChapterIndex = null; // Reset chapter when book changes
        populateChapterSelect(currentBookIndex);
        if (currentBookIndex !== null) {
            localStorage.setItem(LAST_READ_KEY, JSON.stringify({ bookIndex: currentBookIndex, chapterIndex: 0 }));
            displayChapter(currentBookIndex, 0); // Display first chapter of the new book
        } else {
            bibleContent.innerHTML = '<p class="initial-message">Selecione um livro e um capítulo para começar a ler.</p>';
            chapterSelect.disabled = true;
            // clearHighlightsBtn.style.display = 'none'; // Removido
            prevChapterBtn.disabled = true;
            nextChapterBtn.disabled = true;
        }
        updateLastReadInfo();
    });

    function populateChapterSelect(bookIndex) {
        chapterSelect.innerHTML = '<option value="">Selecione um capítulo</option>';
        if (bookIndex !== null && bibleData[bookIndex]) {
            const numChapters = bibleData[bookIndex].chapters.length;
            for (let i = 0; i < numChapters; i++) {
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

    chapterSelect.addEventListener('change', () => {
        currentChapterIndex = chapterSelect.value === "" ? null : parseInt(chapterSelect.value);
        if (currentBookIndex !== null && currentChapterIndex !== null) {
            displayChapter(currentBookIndex, currentChapterIndex);
            localStorage.setItem(LAST_READ_KEY, JSON.stringify({ bookIndex: currentBookIndex, chapterIndex: currentChapterIndex }));
        } else {
            bibleContent.innerHTML = '<p class="initial-message">Selecione um livro e um capítulo para começar a ler.</p>';
        }
        updateLastReadInfo();
    });

    function displayChapter(bookIndex, chapterIndex) {
        if (bookIndex === null || chapterIndex === null || !bibleData[bookIndex] || !bibleData[bookIndex].chapters[chapterIndex]) {
            bibleContent.innerHTML = '<p class="error-message">Capítulo não encontrado.</p>';
            // clearHighlightsBtn.style.display = 'none'; // Removido
            return;
        }

        const chapter = bibleData[bookIndex].chapters[chapterIndex];
        let contentHtml = `<h2>${bibleData[bookIndex].name} - Capítulo ${chapterIndex + 1}</h2>`;

        chapter.forEach((verse, verseIndex) => {
            const highlightId = `${bookIndex}-${chapterIndex}-${verseIndex}`;
            const isHighlighted = highlights.has(highlightId) ? ' highlighted' : '';
            contentHtml += `<p class="verse${isHighlighted}" data-highlight-id="${highlightId}">` +
                           `<span class="verse-number">${verseIndex + 1}</span> ${verse}</p>`;
        });

        bibleContent.innerHTML = contentHtml;
        // clearHighlightsBtn.style.display = 'block'; // Removido
        updateNavigationButtons(bookIndex, chapterIndex);
    }

    function updateNavigationButtons(bookIndex, chapterIndex) {
        const numChapters = bibleData[bookIndex].chapters.length;

        prevChapterBtn.disabled = (chapterIndex === 0 && bookIndex === 0);
        nextChapterBtn.disabled = (chapterIndex === numChapters - 1 && bookIndex === bibleData.length - 1);
    }

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
            localStorage.setItem(LAST_READ_KEY, JSON.stringify({ bookIndex: currentBookIndex, chapterIndex: currentChapterIndex }));
            updateLastReadInfo();
        }
    });

    nextChapterBtn.addEventListener('click', () => {
        if (currentBookIndex !== null && currentChapterIndex !== null) {
            const numChapters = bibleData[currentBookIndex].chapters.length;
            if (currentChapterIndex < numChapters - 1) {
                currentChapterIndex++;
            } else if (currentBookIndex < bibleData.length - 1) {
                currentBookIndex++;
                currentChapterIndex = 0;
            }
            bookSelect.value = currentBookIndex;
            populateChapterSelect(currentBookIndex);
            chapterSelect.value = currentChapterIndex;
            displayChapter(currentBookIndex, currentChapterIndex);
            localStorage.setItem(LAST_READ_KEY, JSON.stringify({ bookIndex: currentBookIndex, chapterIndex: currentChapterIndex }));
            updateLastReadInfo();
        }
    });

    // --- Funções de Destaque (Highlights) ---

    bibleContent.addEventListener('click', (event) => {
        const verseElement = event.target.closest('.verse');
        if (verseElement) {
            const highlightId = verseElement.dataset.highlightId;
            if (highlights.has(highlightId)) {
                highlights.delete(highlightId);
                verseElement.classList.remove('highlighted');
            } else {
                highlights.add(highlightId);
                verseElement.classList.add('highlighted');
            }
            localStorage.setItem('bibleHighlightsSet', JSON.stringify(Array.from(highlights)));
        }
    });

    // clearHighlightsBtn.addEventListener('click', () => { // Removido
    //     if (confirm('Tem certeza que deseja remover todos os destaques do capítulo atual?')) {
    //         const currentChapterHighlights = new Set();
    //         document.querySelectorAll('#bible-content .verse').forEach(verseElement => {
    //             const highlightId = verseElement.dataset.highlightId;
    //             if (highlights.has(highlightId)) {
    //                 highlights.delete(highlightId);
    //                 verseElement.classList.remove('highlighted');
    //             }
    //         });
    //         localStorage.setItem('bibleHighlightsSet', JSON.stringify(Array.from(highlights)));
    //         alert('Destaques removidos do capítulo atual.');
    //     }
    // });

    // --- Funções de Última Leitura ---

    function checkLastReadChapter() {
        const lastRead = JSON.parse(localStorage.getItem(LAST_READ_KEY));
        if (lastRead && bibleData[lastRead.bookIndex] && bibleData[lastRead.bookIndex].chapters[lastRead.chapterIndex]) {
            currentBookIndex = lastRead.bookIndex;
            currentChapterIndex = lastRead.chapterIndex;
            bookSelect.value = currentBookIndex;
            populateChapterSelect(currentBookIndex);
            chapterSelect.value = currentChapterIndex;
            displayChapter(currentBookIndex, currentChapterIndex);
            updateLastReadInfo();
        } else {
            bibleContent.innerHTML = '<p class="initial-message">Selecione um livro e um capítulo para começar a ler.</p>';
            updateLastReadInfo();
        }
    }

    function updateLastReadInfo() {
        const lastRead = JSON.parse(localStorage.getItem(LAST_READ_KEY));
        if (lastRead && bibleData[lastRead.bookIndex] && bibleData[lastRead.bookIndex].chapters[lastRead.chapterIndex]) {
            const bookName = bibleData[lastRead.bookIndex].name;
            const chapterNum = lastRead.chapterIndex + 1;
            lastReadInfo.innerHTML = `Última leitura: <strong>${bookName} - Capítulo ${chapterNum}</strong>`;
            lastReadInfo.style.display = 'block';
        } else {
            lastReadInfo.style.display = 'none';
        }
    }

    // --- Configurações de Tema e Tamanho da Fonte ---

    function updateThemeIcons() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        document.querySelector('#theme-toggle-btn .icon-light').style.display = isDarkMode ? 'none' : 'inline';
        document.querySelector('#theme-toggle-btn .icon-dark').style.display = isDarkMode ? 'inline' : 'none';
    }

    function applySavedSettings() {
        // Aplica Tema
        const savedTheme = localStorage.getItem(THEME_KEY);
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        updateThemeIcons(); // Update icons based on theme

        // Aplica Tamanho da Fonte
        const savedFontSize = localStorage.getItem(FONT_SIZE_KEY);
        if (savedFontSize) {
            document.documentElement.style.setProperty('--base-font-size', `${savedFontSize}rem`);
            fontSizeSelect.value = savedFontSize; // Update hidden select
        } else {
            // Set default font size if not saved
            const defaultFontSize = '1.0'; // Corresponds to 'Padrão'
            document.documentElement.style.setProperty('--base-font-size', `${defaultFontSize}rem`);
            localStorage.setItem(FONT_SIZE_KEY, defaultFontSize);
            fontSizeSelect.value = defaultFontSize;
        }
        currentFontSizeIndex = fontSizes.indexOf(parseFloat(localStorage.getItem(FONT_SIZE_KEY) || '1.0'));
    }

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem(THEME_KEY, 'dark');
        } else {
            localStorage.setItem(THEME_KEY, 'light');
        }
        updateThemeIcons(); // Update icons after toggle
    });

    // Font size controls
    const fontSizes = [1.0, 1.1, 1.2, 1.3]; // Corresponds to Padrão, Médio, Grande, Muito Grande
    let currentFontSizeIndex = fontSizes.indexOf(parseFloat(localStorage.getItem(FONT_SIZE_KEY) || '1.0'));

    decreaseFontSizeBtn.addEventListener('click', () => {
        if (currentFontSizeIndex > 0) {
            currentFontSizeIndex--;
            const newFontSize = fontSizes[currentFontSizeIndex];
            document.documentElement.style.setProperty('--base-font-size', `${newFontSize}rem`);
            localStorage.setItem(FONT_SIZE_KEY, newFontSize.toString());
            fontSizeSelect.value = newFontSize.toString(); // Update hidden select value
        }
    });

    increaseFontSizeBtn.addEventListener('click', () => {
        if (currentFontSizeIndex < fontSizes.length - 1) {
            currentFontSizeIndex++;
            const newFontSize = fontSizes[currentFontSizeIndex];
            document.documentElement.style.setProperty('--base-font-size', `${newFontSize}rem`);
            localStorage.setItem(FONT_SIZE_KEY, newFontSize.toString());
            fontSizeSelect.value = newFontSize.toString(); // Update hidden select value
        }
    });

    // Initial load
    loadBibleData();
});