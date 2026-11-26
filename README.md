Since browsers block local JS modules (file://), you need to run [index.html](index.html) using a local server.<br>
The simpliest solution is to install ["Live Server"](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)  extension in vscode and launch<br>
Or you can use python: 
1. Open your terminal in the project folder (`cd path\to\project`) and run:
   ```bash
   python -m http.server 8000
   ```
   *(Use `python3` on macOS/Linux)*
2. Open `http://localhost:8000` in your browser.
3. Press `Ctrl + C` in the terminal to stop the server.
