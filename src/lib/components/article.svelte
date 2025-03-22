<script lang="ts">
    import { onMount } from 'svelte';
    import rehypeStringify from 'rehype-stringify';
    import rehypeRaw from 'rehype-raw';
    import remarkParse from 'remark-parse';
    import remarkRehype from 'remark-rehype';
    import remarkGfm from 'remark-gfm';
    import { unified } from 'unified';

    export let content = '';
    export let filePath = '';

    let htmlContent = '';

    async function processMarkdown(markdown: string) {
        const result = await unified()
            .use(remarkParse)
            .use(remarkGfm)
            .use(remarkRehype, { allowDangerousHtml: true })
            .use(rehypeRaw)
            .use(rehypeStringify)
            .process(markdown);

        return String(result);
    }

    async function loadAndProcessFile() {
        if (filePath) {
            try {
                const response = await fetch(`/${filePath.replace(/^\//, '')}`);
                if (!response.ok) {
                    throw new Error(`Failed to load file: ${response.statusText}`);
                }
                const text = await response.text();
                htmlContent = await processMarkdown(text);
            } catch (error) {
                console.error('Error loading markdown file:', error);
                const errorMessage = (error as Error).message;
                htmlContent = `<p>Error loading content: ${errorMessage}</p>`;
            }
        } else if (content) {
            htmlContent = await processMarkdown(content);
        }
    }

    function copyToClipboard(event) {
        const codeBlock = event.target.closest('.code-wrapper').querySelector('pre');
        const code = codeBlock.textContent;
        navigator.clipboard.writeText(code);

        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    }

    $: {
        if (htmlContent) {
            // Wait for DOM update
            setTimeout(() => {
                const codeBlocks = document.querySelectorAll('article pre');
                codeBlocks.forEach(block => {
                    if (block.parentElement && !block.parentElement.classList.contains('code-wrapper')) {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'code-wrapper';
                        const copyButton = document.createElement('button');
                        copyButton.className = 'copy-button';
                        copyButton.textContent = 'Copy';
                        copyButton.onclick = copyToClipboard;

                        if (block.parentNode) {
                            block.parentNode.insertBefore(wrapper, block);
                        }
                        wrapper.appendChild(block);
                        wrapper.appendChild(copyButton);
                    }
                });
            }, 0);
        }
    }

    onMount(loadAndProcessFile);
</script>

<article>
    {@html htmlContent}
</article>

<style>
    article {
        max-width: 800px;
        margin: 0 auto;
        padding: 1rem;
    }

    article :global(h1) { font-size: 2em; margin: 1em 0; }
    article :global(h2) { font-size: 1.5em; margin: 0.83em 0; }
    article :global(h3) { font-size: 1.17em; margin: 0.67em 0; }

    article :global(p) {
        margin-bottom: 1rem;
        line-height: 1.6;
    }

    article :global(ul), article :global(ol) {
        margin: 1em 0;
        padding-left: 2em;
    }

    article :global(li) {
        margin: 0.5em 0;
    }

    article :global(code) {
        background-color: #f4f4f4;
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-family: monospace;
    }

    article :global(pre) {
        background-color: #f4f4f4;
        padding: 1rem;
        border-radius: 5px;
        overflow-x: auto;
        margin: 1em 0;
    }

    article :global(blockquote) {
        border-left: 4px solid #ddd;
        padding-left: 1em;
        margin: 1em 0;
        color: #666;
    }

    article :global(a) {
        color: #0366d6;
        text-decoration: none;
    }

    article :global(a:hover) {
        text-decoration: underline;
    }

    article :global(.code-wrapper) {
        position: relative;
    }

    article :global(.copy-button) {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        padding: 0.25rem 0.5rem;
        background-color: #ffffff;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;
        opacity: 0;
        transition: opacity 0.2s;
    }

    article :global(.code-wrapper:hover .copy-button) {
        opacity: 1;
    }

    article :global(.copy-button:hover) {
        background-color: #f0f0f0;
    }

    article :global(.copy-button:active) {
        background-color: #e0e0e0;
    }

    article :global(.markdown-image) {
        max-width: 100%;
        height: auto;
        margin: 1rem 0;
        border-radius: 4px;
    }

    article :global(p[align="right"]) {
        text-align: right;
    }

    article :global(p[align="left"]) {
        text-align: left;
    }

    article :global(p[align="center"]) {
        text-align: center;
    }
</style>
