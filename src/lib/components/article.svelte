<!--
    Article Component Documentation
    =============================

    This component renders Markdown content into HTML
    It supports three different ways to provide content:

    1. Direct content:
       <Article content={markdownContent} />

    2. Local file path:
       <Article filePath="markdown/example.md" />

    3. Remote URL:
       <Article url="https://raw.githubusercontent.com/user/repo/main/README.md" />

    Example usage:
    -------------

<script>
    import Article from "$lib/components/article.svelte";

    const markdownContent = `# Direct Content Example
This is a paragraph with **bold text** and *italic text*.

\`\`\`js
console.log('Hello from inline markdown!');
\`\`\`

<p align="right">
  <img src="https://upload.wikimedia.org/wikipedia/commons/1/1b/Svelte_Logo.svg" alt="Logo Svelte" width="100">
</p>

- List item 1
- List item 2

![Logo Svelte](https://upload.wikimedia.org/wikipedia/commons/1/1b/Svelte_Logo.svg)

`;
</script>

<Article content={markdownContent} />
<Article filePath="markdown/TEST.md" />
<Article url="https://raw.githubusercontent.com/KubiV/blue-light-oroboros/refs/heads/main/README.md?token=GHSAT0AAAAAADA6E2SYJWJBGICIF5IXHJJWZ67ZOCQ" />

-->

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
    export let url = '';

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
        try {
            let text;
            if (url) {
                try {
                    const response = await fetch(url, {
                        headers: {
                            'Accept': 'text/plain,text/markdown,*/*'
                        }
                    });
                    if (!response.ok) {
                        throw new Error(
                            response.status === 404 ? 'File not found' :
                            response.status === 403 ? 'Access denied' :
                            `Server returned ${response.status} ${response.statusText}`
                        );
                    }
                    text = await response.text();
                } catch (fetchError) {
                    // Handle CORS and network errors specifically
                    const errorMessage = fetchError instanceof TypeError && fetchError.message.includes('CORS') ?
                        'CORS policy prevented loading the content. The server needs to allow access.' :
                        fetchError instanceof TypeError ?
                        'Network error. Check your connection or the URL validity.' :
                        (fetchError as Error).message;
                    throw new Error(`Failed to load URL: ${errorMessage}`);
                }
            } else if (filePath) {
                const response = await fetch(`/${filePath.replace(/^\//, '')}`);
                if (!response.ok) {
                    throw new Error(`Failed to load file: ${response.statusText}`);
                }
                text = await response.text();
            } else if (content) {
                text = content;
            } else {
                throw new Error('No content source provided');
            }
            htmlContent = await processMarkdown(text);
        } catch (error) {
            console.error('Error loading markdown:', error);
            const errorMessage = (error as Error).message;
            htmlContent = `<div class="error-message">⚠️ ${errorMessage}</div>`;
        }
    }

    function copyToClipboard(event: any) {
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

    article :global(.error-message) {
        color: #721c24;
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        border-radius: 4px;
        padding: 1rem;
        margin: 1rem 0;
    }
</style>
