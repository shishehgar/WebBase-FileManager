# Setting Up GitHub Copilot in VS Code Server

This guide provides step-by-step instructions for setting up GitHub Copilot in VS Code Server (code-server) for AI-assisted coding.

## Prerequisites

Before you begin, ensure you have:

- A GitHub account
- An active GitHub Copilot subscription (Individual, Business, or Enterprise)
- VS Code Server (code-server) installed on your machine/server

---

## Step 1: Install VS Code Server (code-server)

If you haven't installed VS Code Server yet, follow these steps:

### Option A: Quick Install Script

> **Security Note:** It's recommended to inspect scripts before execution. Download and review the script first if preferred.

```bash
# Option 1: Download, inspect, then run
curl -fsSL https://code-server.dev/install.sh -o install.sh
# Review the script: cat install.sh
sh install.sh

# Option 2: Direct execution (only from trusted sources)
curl -fsSL https://code-server.dev/install.sh | sh
```

### Option B: Manual Installation

1. Download the latest release from [code-server releases](https://github.com/coder/code-server/releases)

2. Extract and install:
   ```bash
   tar -xzf code-server-*-linux-amd64.tar.gz
   sudo mv code-server-*-linux-amd64 /usr/local/lib/code-server
   sudo ln -s /usr/local/lib/code-server/bin/code-server /usr/local/bin/code-server
   ```

### Option C: Using Docker

```bash
docker run -it -p 8080:8080 \
  -v "$HOME/.config:/home/coder/.config" \
  -v "$PWD:/home/coder/project" \
  codercom/code-server:latest
```

---

## Step 2: Start VS Code Server

1. Start code-server:
   ```bash
   code-server
   ```

2. Access VS Code Server in your browser at `http://localhost:8080`

3. Find your password in `~/.config/code-server/config.yaml`:
   ```bash
   cat ~/.config/code-server/config.yaml
   ```

---

## Step 3: Install GitHub Copilot Extension

1. **Open Extensions Panel**
   - Click the Extensions icon in the left sidebar (or press `Ctrl+Shift+X`)

2. **Search for Copilot**
   - Type `GitHub Copilot` in the search box

3. **Install the Extension**
   - Find "GitHub Copilot" by GitHub
   - Click the **Install** button

4. **Also Install GitHub Copilot Chat (Recommended)**
   - Search for `GitHub Copilot Chat`
   - Click **Install**

---

## Step 4: Authenticate with GitHub

After installing the extension, you need to sign in to GitHub:

1. **Open Command Palette**
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)

2. **Sign In**
   - Type `GitHub Copilot: Sign In`
   - Select the command from the dropdown

3. **Complete Authentication**
   - A dialog will appear with a device code
   - Click "Copy & Continue to GitHub"
   - You'll be redirected to GitHub's device activation page
   - Paste the code and authorize the application

4. **Verify Connection**
   - After successful authentication, you should see a Copilot icon in the status bar
   - The icon should show as active (not grayed out)

---

## Step 5: Configure Copilot Settings

### Basic Settings

1. **Open Settings**
   - Press `Ctrl+,` (or `Cmd+,` on macOS)
   - Or go to File → Preferences → Settings

2. **Search for Copilot**
   - Type `Copilot` in the search box

3. **Recommended Settings**

   ```json
   {
     "github.copilot.enable": {
       "*": true,
       "plaintext": true,
       "markdown": true,
       "scminput": false
     },
     "github.copilot.inlineSuggest.enable": true,
     "editor.inlineSuggest.enabled": true
   }
   ```

### Enable/Disable for Specific Languages

You can enable or disable Copilot for specific file types:

```json
{
  "github.copilot.enable": {
    "*": true,
    "yaml": true,
    "plaintext": false,
    "markdown": true,
    "python": true,
    "javascript": true,
    "typescript": true,
    "html": true,
    "css": true
  }
}
```

---

## Step 6: Using GitHub Copilot

### Inline Suggestions

1. Start typing code in your editor
2. Copilot will automatically suggest completions (shown in gray text)
3. Press `Tab` to accept a suggestion
4. Press `Esc` to dismiss a suggestion
5. Press `Alt+]` to see next suggestion
6. Press `Alt+[` to see previous suggestion

### Copilot Chat (if installed)

1. **Open Chat Panel**
   - Click the Copilot Chat icon in the sidebar
   - Or press `Ctrl+Shift+I`

2. **Ask Questions**
   - Type your coding questions
   - Ask for code explanations
   - Request code reviews

3. **Inline Chat**
   - Select code and press `Ctrl+I` for inline chat
   - Ask Copilot to modify, explain, or fix the selected code

---

## Keyboard Shortcuts Reference

| Action | Windows/Linux | macOS |
|--------|--------------|-------|
| Accept suggestion | `Tab` | `Tab` |
| Dismiss suggestion | `Esc` | `Esc` |
| Next suggestion | `Alt+]` | `Option+]` |
| Previous suggestion | `Alt+[` | `Option+[` |
| Open Copilot Chat | `Ctrl+Shift+I` | `Cmd+Shift+I` |
| Inline Chat | `Ctrl+I` | `Cmd+I` |
| Trigger suggestion | `Alt+\` | `Option+\` |

---

## Troubleshooting

### Copilot Not Showing Suggestions

1. **Check Status Bar**
   - Look for the Copilot icon in the bottom status bar
   - If it shows an error, click on it for details

2. **Verify Authentication**
   - Open Command Palette (`Ctrl+Shift+P`)
   - Run `GitHub Copilot: Sign In` again

3. **Check Extension Status**
   - Go to Extensions panel
   - Ensure GitHub Copilot is enabled

4. **Restart VS Code Server**
   ```bash
   # Stop code-server
   pkill code-server
   
   # Start again
   code-server
   ```

### Authentication Issues

If you see "GitHub Copilot could not connect to the server":

1. **Check Network**
   - Ensure you have internet connectivity
   - Check if your network allows connections to GitHub

2. **Clear Credentials**
   ```bash
   # Remove stored Copilot credentials
   # First, check if the directory exists
   COPILOT_DIR="$HOME/.config/code-server/User/globalStorage"
   if [ -d "$COPILOT_DIR" ]; then
       # List files to be removed
       ls -la "$COPILOT_DIR" | grep github.copilot
       # Remove the Copilot-related directories
       rm -rf "$COPILOT_DIR/github.copilot" "$COPILOT_DIR/github.copilot-chat"
   fi
   ```

3. **Re-authenticate**
   - Restart code-server
   - Sign in again through the extension

### Extension Not Installing

If the extension won't install from the marketplace:

1. **Install from VSIX**
   - Download the `.vsix` file from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=GitHub.copilot)
   - In code-server, go to Extensions → `...` menu → "Install from VSIX"
   - Select the downloaded file

---

## Security Considerations

- **Keep Authentication Secure**: Don't share your GitHub credentials
- **Review Suggestions**: Always review Copilot's suggestions before accepting
- **Sensitive Code**: Be aware that Copilot suggestions are based on patterns; never blindly accept code that handles sensitive data
- **Network Security**: Use HTTPS when accessing code-server remotely

---

## Additional Resources

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [VS Code Server Documentation](https://coder.com/docs/code-server)
- [GitHub Copilot FAQ](https://github.com/features/copilot#faq)

---

## Quick Summary

1. ✅ Install VS Code Server (code-server)
2. ✅ Start code-server and access via browser
3. ✅ Install GitHub Copilot extension from Extensions panel
4. ✅ Sign in to GitHub when prompted
5. ✅ Configure settings as needed
6. ✅ Start coding with AI assistance!

Happy Coding! 🚀
