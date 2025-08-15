document.addEventListener('DOMContentLoaded', function() {
    // --- THEME TOGGLE LOGIC ---
    const themeToggle = document.getElementById('theme-toggle');
    const docHtml = document.documentElement;

    // Function to apply the saved theme
    const applyTheme = (theme) => {
        docHtml.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    };

    // Check for saved theme in localStorage or user's OS preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (prefersDark) {
        applyTheme('dark');
    } else {
        applyTheme('light');
    }

    // Event listener for the toggle button
    themeToggle.addEventListener('click', () => {
        const currentTheme = docHtml.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    });

    // --- NAVBAR SCROLL EFFECT ---
    const nav = document.querySelector('.main-nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // --- EXISTING SUMMARIZER LOGIC ---
    const form = document.getElementById('summarizer-form');
    const textInput = document.getElementById('text-input');
    const docInput = document.getElementById('document-input');
    const fileNameDisplay = document.getElementById('file-name-display');
    const summaryOutput = document.getElementById('summary-output');
    const resultContainer = document.getElementById('result-container');
    const spinner = document.getElementById('loading-spinner');
    const ctaButton = document.querySelector('.cta-button');
    const downloadBtn = document.getElementById('download-btn');

    if(ctaButton) {
        ctaButton.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({ behavior: 'smooth' });
        });
    }

    docInput.addEventListener('change', function(event) {
        if (event.target.files.length > 0) {
            fileNameDisplay.textContent = `Selected: ${event.target.files[0].name}`;
            textInput.value = '';
            textInput.placeholder = "File selected. Click 'Generate Summary'.";
        }
    });

    textInput.addEventListener('input', function() {
        if (textInput.value) {
            docInput.value = '';
            fileNameDisplay.textContent = '';
            textInput.placeholder = "Paste your text here or upload a document...";
        }
    });

    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const formData = new FormData(form);
        if (!textInput.value.trim() && docInput.files.length === 0) {
            alert('Please provide text or upload a document.');
            return;
        }

        resultContainer.style.display = 'block';
        summaryOutput.innerHTML = '';
        downloadBtn.style.display = 'none';
        spinner.style.display = 'block';

        try {
            const response = await fetch('/summarize', { method: 'POST', body: formData });
            const result = await response.json();

            if (response.ok) {
                let i = 0;
                const text = result.summary;
                function typeWriter() {
                    if (i < text.length) {
                        summaryOutput.innerHTML += text.charAt(i);
                        i++;
                        setTimeout(typeWriter, 15);
                    } else {
                        downloadBtn.style.display = 'inline-block';
                    }
                }
                typeWriter();
            } else {
                summaryOutput.textContent = `Error: ${result.error}`;
            }
        } catch (error) {
            summaryOutput.textContent = 'An unexpected error occurred. Please try again.';
        } finally {
            spinner.style.display = 'none';
        }
    });

    downloadBtn.addEventListener('click', async function() {
        const summaryText = summaryOutput.textContent;
        if (!summaryText) return;

        try {
            const response = await fetch('/download_pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ summary_text: summaryText })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'summary.pdf';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            } else {
                alert('Failed to download PDF.');
            }
        } catch (error) {
            alert('An error occurred while downloading the PDF.');
        }
    });
});