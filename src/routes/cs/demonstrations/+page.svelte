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

<h1>Příklady</h1>
<ul>
    <li>1</li>
    <li>2</li>
</ul>

<Article content={markdownContent} />
<Article filePath="markdown/TEST.md" />
