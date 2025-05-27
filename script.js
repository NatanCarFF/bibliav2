document.addEventListener('DOMContentLoaded', () => {
    const bookSelect = document.getElementById('book-select');
    const chapterSelect = document.getElementById('chapter-select');
    const bibleContent = document.getElementById('bible-content');
    let bibleData = []; // Variável para armazenar os dados da Bíblia

    // Função para carregar os dados da Bíblia
    async function loadBibleData() {
        try {
            const response = await fetch('biblia.json');
            if (!response.ok) {
                throw new Error(`Erro ao carregar biblia.json: ${response.statusText}`);
            }
            bibleData = await response.json();
            populateBookSelect();
        } catch (error) {
            console.error('Falha ao carregar os dados da Bíblia:', error);
            bibleContent.innerHTML = '<p class="error-message">Não foi possível carregar a Bíblia. Por favor, tente novamente mais tarde.</p>';
        }
    }

    // Função para preencher o dropdown de livros
    function populateBookSelect() {
        bookSelect.innerHTML = '<option value="">Selecione um livro</option>'; // Limpa e adiciona a opção padrão
        bibleData.forEach((book, index) => {
            const option = document.createElement('option');
            option.value = index; // Usar o índice como valor
            option.textContent = book.abbrev; // Exibe a abreviação do livro
            bookSelect.appendChild(option);
        });
    }

    // Event Listener para quando um livro é selecionado
    bookSelect.addEventListener('change', () => {
        const selectedBookIndex = bookSelect.value;
        chapterSelect.innerHTML = '<option value="">Selecione um capítulo</option>'; // Limpa capítulos anteriores
        bibleContent.innerHTML = '<p class="initial-message">Selecione um capítulo para começar a ler.</p>'; // Limpa o conteúdo

        if (selectedBookIndex !== "") {
            const book = bibleData[selectedBookIndex];
            for (let i = 0; i < book.chapters.length; i++) {
                const option = document.createElement('option');
                option.value = i; // Usar o índice do capítulo
                option.textContent = `Capítulo ${i + 1}`;
                chapterSelect.appendChild(option);
            }
            chapterSelect.disabled = false; // Habilita o dropdown de capítulos
        } else {
            chapterSelect.disabled = true; // Desabilita se nenhum livro for selecionado
        }
    });

    // Event Listener para quando um capítulo é selecionado
    chapterSelect.addEventListener('change', () => {
        const selectedBookIndex = bookSelect.value;
        const selectedChapterIndex = chapterSelect.value;

        if (selectedBookIndex !== "" && selectedChapterIndex !== "") {
            const book = bibleData[selectedBookIndex];
            const chapter = book.chapters[selectedChapterIndex];
            displayChapter(chapter);
        } else {
            bibleContent.innerHTML = '<p class="initial-message">Selecione um livro e um capítulo para começar a ler.</p>';
        }
    });

    // Função para exibir o conteúdo do capítulo
    function displayChapter(chapter) {
        bibleContent.innerHTML = ''; // Limpa o conteúdo anterior
        chapter.forEach((verse, index) => {
            const p = document.createElement('p');
            p.innerHTML = `<span class="verse-number">${index + 1}.</span> ${verse}`;
            bibleContent.appendChild(p);
        });
    }

    // Carrega os dados da Bíblia quando a página é carregada
    loadBibleData();
});