To use you simply need to launch index.html
But the only problem is that browsers don't like launching js from disc, so you'll need to do something about it.<br>
The simpliest solution is to install ["Live Server"](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)  extension in vscode and launch<br>
Or you can use python: 
1. Open your terminal in the project folder (`cd path\to\project`) and run:
   ```bash
   python -m http.server 8000
   ```
   *(Use `python3` on macOS/Linux)*
2. Open `http://localhost:8000` in your browser.
3. Press `Ctrl + C` in the terminal to stop the server.
