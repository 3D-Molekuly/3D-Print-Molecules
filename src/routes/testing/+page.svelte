<script>
    let searchQuery = '';
    let selectedFile = null;

    function handleFileChange(event) {
      selectedFile = event.target.files[0];
    }

    function fetchData() {
      console.log("Fetching data for:", searchQuery);
      if (selectedFile) {
        console.log("Selected file:", selectedFile.name);
      } else {
        console.log("No file selected.");
      }
    }
  </script>

  <style>
    /* Stylování pro navbar */
    nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #333;
      color: white;
    }

    nav .logo {
      font-size: 1.5em;
      font-weight: bold;
    }

    nav ul {
      list-style: none;
      display: flex;
      gap: 20px;
    }

    nav ul li {
      cursor: pointer;
    }

    /* Stylování pro vyhledávací sekci */
    .search-section {
      display: flex;
      padding: 20px;
      gap: 10px;
      align-items: center;
    }

    .search-input {
      padding: 10px;
      font-size: 1em;
      width: 300px;
    }

    .file-input {
      padding: 10px;
    }

    .button {
      padding: 10px 20px;
      background-color: #007BFF;
      color: white;
      border: none;
      cursor: pointer;
      font-size: 1em;
    }

    .button:hover {
      background-color: #0056b3;
    }
  </style>

  <nav>
    <div class="logo">
      <img src="/logo.png" alt="Logo" height="40" style="margin-right: 10px;">
      3D Printing Molecules
    </div>

    <ul>
      <li>About</li>
      <li>Make Models</li>
      <li>
        <select>
          <option value="cs">CS</option>
          <option value="en">ENG</option>
        </select>
      </li>
    </ul>
  </nav>

  <div class="search-section">
    <input
      type="text"
      class="search-input"
      placeholder="Search..."
      bind:value={searchQuery}
    />

    <input
      type="file"
      class="file-input"
      on:change={handleFileChange}
    />

    <button class="button" on:click={fetchData}>Fetch Data</button>
  </div>
