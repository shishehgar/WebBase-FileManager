// Project: file_manager
// File Path: file_manager/static/js/app.js
// Last Updated: 2025-08-08 07:40:00

document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const appContainer = document.getElementById('app-container');
    const fileListEl = document.getElementById('file-list');
    const breadcrumbEl = document.getElementById('breadcrumb');
    const loaderEl = document.getElementById('loader');
    const contextMenuEl = document.getElementById('context-menu');
    const toastContainer = document.getElementById('toast-container');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    const floatingActionBar = document.getElementById('floating-action-bar');
    const selectionCount = document.getElementById('selection-count');
    const searchInput = document.getElementById('search-input');
    const dragOverlay = document.getElementById('drag-overlay');
    const emptyFolderMessage = document.getElementById('empty-folder-message');
    const previewPanel = { el: document.getElementById('preview-panel'), placeholder: document.getElementById('preview-placeholder'), content: document.getElementById('preview-content'), header: document.getElementById('preview-header'), name: document.getElementById('preview-name'), visual: document.getElementById('preview-visual'), details: document.getElementById('preview-details'), closeBtn: document.getElementById('preview-close-btn') };
    
    // --- Buttons ---
    const btnNewFolder = document.getElementById('btn-new-folder');
    const btnNewFile = document.getElementById('btn-new-file');
    const btnUpload = document.getElementById('btn-upload');
    const fileUploadInput = document.getElementById('file-upload-input');
    const btnCopySelected = document.getElementById('btn-copy-selected');
    const btnMoveSelected = document.getElementById('btn-move-selected');
    const btnDeleteSelected = document.getElementById('btn-delete-selected');
    const btnCompressSelected = document.getElementById('btn-compress-selected');
    const btnListView = document.getElementById('btn-list-view');
    const btnGridView = document.getElementById('btn-grid-view');

    // --- Modals ---
    const confirmModal = { el: document.getElementById('confirm-modal'), title: document.getElementById('confirm-modal-title'), text: document.getElementById('confirm-modal-text'), okBtn: document.getElementById('confirm-modal-ok'), cancelBtn: document.getElementById('confirm-modal-cancel') };
    const inputModal = { el: document.getElementById('input-modal'), title: document.getElementById('input-modal-title'), input: document.getElementById('input-modal-text'), okBtn: document.getElementById('input-modal-ok'), cancelBtn: document.getElementById('input-modal-cancel'), closeBtn: document.getElementById('input-modal-close') };
    const imageModal = { el: document.getElementById('image-modal'), img: document.getElementById('image-modal-src'), caption: document.getElementById('image-modal-caption'), closeBtn: document.getElementById('image-modal-close') };
    const editorModal = { el: document.getElementById('editor-modal'), title: document.getElementById('editor-modal-title'), textarea: document.getElementById('editor-modal-textarea'), closeBtn: document.getElementById('editor-modal-close'), saveBtn: document.getElementById('editor-modal-save') };
    const permissionsModal = { el: document.getElementById('permissions-modal'), title: document.getElementById('permissions-modal-title'), input: document.getElementById('permissions-modal-input'), okBtn: document.getElementById('permissions-modal-ok'), cancelBtn: document.getElementById('permissions-modal-cancel'), closeBtn: document.getElementById('permissions-modal-close') };
    const moveModal = { el: document.getElementById('move-modal'), title: document.getElementById('move-modal-title'), tree: document.getElementById('move-modal-tree'), okBtn: document.getElementById('move-modal-ok'), cancelBtn: document.getElementById('move-modal-cancel'), closeBtn: document.getElementById('move-modal-close') };
    const unsavedModal = { el: document.getElementById('unsaved-modal'), saveBtn: document.getElementById('unsaved-modal-save'), discardBtn: document.getElementById('unsaved-modal-discard'), cancelBtn: document.getElementById('unsaved-modal-cancel') };
    const pdfModal = { el: document.getElementById('pdf-modal'), title: document.getElementById('pdf-modal-title'), canvas: document.getElementById('pdf-canvas'), prevBtn: document.getElementById('pdf-prev'), nextBtn: document.getElementById('pdf-next'), pageInfo: document.getElementById('pdf-page-info'), closeBtn: document.getElementById('pdf-modal-close') };
    const mediaModal = { el: document.getElementById('media-modal'), title: document.getElementById('media-modal-title'), body: document.getElementById('media-modal-body'), closeBtn: document.getElementById('media-modal-close') };

    // --- State ---
    let currentPath = '';
    let selectedItems = new Set();
    let codeEditor;
    let editorHasUnsavedChanges = false;
    let originalEditorContent = '';
    let currentFilePathInEditor = '';
    let allFiles = []; 
    let currentSort = { key: 'name', order: 'asc' };
    let currentView = 'list';
    let focusedItemIndex = -1;

    // --- Utility Functions ---
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    function showConfirm(title, text, type = 'danger') {
        return new Promise(resolve => {
            const icon = type === 'danger' ? 'fa-exclamation-triangle' : 'fa-question-circle';
            confirmModal.title.innerHTML = `<i class="fas ${icon}"></i> ${title}`;
            confirmModal.text.textContent = text;
            confirmModal.okBtn.className = `btn btn-${type}`;
            confirmModal.el.style.display = 'flex';
            const onOk = () => { cleanup(); resolve(true); };
            const onCancel = () => { cleanup(); resolve(false); };
            const cleanup = () => {
                confirmModal.el.style.display = 'none';
                confirmModal.okBtn.removeEventListener('click', onOk);
                confirmModal.cancelBtn.removeEventListener('click', onCancel);
            };
            confirmModal.okBtn.addEventListener('click', onOk);
            confirmModal.cancelBtn.addEventListener('click', onCancel);
        });
    }

    function showInput(title, initialValue = '') {
        return new Promise(resolve => {
            inputModal.title.textContent = title;
            inputModal.input.value = '';
            inputModal.input.placeholder = initialValue;
            inputModal.el.style.display = 'flex';
            inputModal.input.focus();
            const onOk = () => { cleanup(); resolve(inputModal.input.value); };
            const onCancel = () => { cleanup(); resolve(null); };
            const cleanup = () => {
                inputModal.el.style.display = 'none';
                inputModal.okBtn.removeEventListener('click', onOk);
                inputModal.cancelBtn.removeEventListener('click', onCancel);
                inputModal.closeBtn.removeEventListener('click', onCancel);
            };
            inputModal.okBtn.addEventListener('click', onOk);
            inputModal.cancelBtn.addEventListener('click', onCancel);
            inputModal.closeBtn.addEventListener('click', onCancel);
        });
    }

    function showUnsavedChangesPrompt() {
        return new Promise(resolve => {
            unsavedModal.el.style.display = 'flex';
            const cleanup = (decision) => {
                unsavedModal.el.style.display = 'none';
                unsavedModal.saveBtn.removeEventListener('click', onSave);
                unsavedModal.discardBtn.removeEventListener('click', onDiscard);
                unsavedModal.cancelBtn.removeEventListener('click', onCancel);
                resolve(decision);
            };
            const onSave = () => cleanup('save');
            const onDiscard = () => cleanup('discard');
            const onCancel = () => cleanup('cancel');
            unsavedModal.saveBtn.addEventListener('click', onSave);
            unsavedModal.discardBtn.addEventListener('click', onDiscard);
            unsavedModal.cancelBtn.addEventListener('click', onCancel);
        });
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function formatTimestamp(timestamp) {
        const date = new Date(timestamp * 1000);
        return date.toLocaleString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '');
    }

    function getIconForFile(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        if (extension === filename && !filename.includes('.')) return 'fas fa-file-alt';
        const iconMap = {
            py: 'fab fa-python', js: 'fab fa-js-square', html: 'fab fa-html5', css: 'fab fa-css3-alt',
            json: 'fas fa-file-code', md: 'fab fa-markdown',
            png: 'fas fa-file-image', jpg: 'fas fa-file-image', jpeg: 'fas fa-file-image', gif: 'fas fa-file-image', svg: 'fas fa-file-image',
            pdf: 'fas fa-file-pdf',
            zip: 'fas fa-file-archive', rar: 'fas fa-file-archive', gz: 'fas fa-file-archive',
            mp3: 'fas fa-file-audio', wav: 'fas fa-file-audio', ogg: 'fas fa-file-audio',
            mp4: 'fas fa-file-video', webm: 'fas fa-file-video', mov: 'fas fa-file-video',
        };
        return iconMap[extension] || 'fas fa-file-alt';
    }

    async function apiCall(endpoint, options = {}) {
        loaderEl.style.display = 'flex';
        try {
            const newOptions = { ...options };
            if (!(newOptions.body instanceof FormData)) {
                if (!newOptions.headers) newOptions.headers = {};
                newOptions.headers['Content-Type'] = 'application/json';
            }
            const response = await fetch(endpoint, newOptions);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Unknown server error');
            }
            if (response.headers.get('Content-Type')?.includes('application/json')) {
                return response.json();
            }
            return response;
        } catch (err) {
            showToast(`Error: ${err.message}`, 'error');
            throw err;
        } finally {
            loaderEl.style.display = 'none';
        }
    }

    function renderBreadcrumb() {
        breadcrumbEl.innerHTML = '';
        const parts = currentPath.split('/').filter(p => p);
        const rootLink = document.createElement('a');
        rootLink.href = '#';
        rootLink.innerText = 'Root';
        rootLink.addEventListener('click', (e) => { e.preventDefault(); loadFiles(''); });
        breadcrumbEl.appendChild(rootLink);

        let path = '';
        parts.forEach(part => {
            path += `/${part}`;
            breadcrumbEl.appendChild(document.createTextNode(' / '));
            const link = document.createElement('a');
            link.href = '#';
            link.innerText = part;
            const currentPartPath = path;
            link.addEventListener('click', (e) => { e.preventDefault(); loadFiles(currentPartPath); });
            breadcrumbEl.appendChild(link);
        });
    }
    
    // --- UI Rendering ---
    function renderFileList() {
        fileListEl.innerHTML = '';
        const searchTerm = searchInput.value.toLowerCase();

        const filteredFiles = searchTerm
            ? allFiles.filter(item => item.name.toLowerCase().includes(searchTerm))
            : allFiles;

        const sortedFiles = [...filteredFiles].sort((a, b) => {
            const key = currentSort.key;
            const order = currentSort.order === 'asc' ? 1 : -1;
            if (a.type === 'dir' && b.type !== 'dir') return -1;
            if (a.type !== 'dir' && b.type === 'dir') return 1;
            let valA = a[key];
            let valB = b[key];
            if (key === 'name') {
                return valA.localeCompare(valB) * order;
            }
            if (key === 'size' || key === 'last_modified') {
                return (valA - valB) * order;
            }
            return 0;
        });

        if (currentPath) {
            const parentLi = document.createElement('li');
            parentLi.className = 'go-up-item';
            parentLi.dataset.index = -1;
            parentLi.innerHTML = `<div class="col-check"></div><div class="col-name"><i class="fas fa-level-up-alt"></i><span>..</span></div><div class="col-type"></div><div class="col-perms"></div><div class="col-modified"></div><div class="col-size"></div>`;
            parentLi.addEventListener('click', () => loadFiles(currentPath.substring(0, currentPath.lastIndexOf('/'))));
            fileListEl.appendChild(parentLi);
        }

        sortedFiles.forEach((item, index) => fileListEl.appendChild(createListItem(item, index)));

        if (sortedFiles.length === 0) {
            emptyFolderMessage.style.display = 'flex';
        } else {
            emptyFolderMessage.style.display = 'none';
        }

        document.querySelectorAll('.sortable').forEach(header => {
            const key = header.dataset.sort;
            const icon = header.querySelector('i');
            if (key === currentSort.key) {
                icon.className = currentSort.order === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
            } else {
                icon.className = 'fas fa-sort';
            }
        });
        
        updateFocus();
    }

    function createListItem(item, index) {
        const li = document.createElement('li');
        li.className = 'file-item';
        li.dataset.index = index;
        const fullPath = `${currentPath}/${item.name}`.replace(/^\//, '');
        li.dataset.path = fullPath;
        let iconClass = item.type === 'dir' ? 'fas fa-folder' : getIconForFile(item.name);
        li.innerHTML = `
            <div class="col-check"><input type="checkbox" class="file-item-checkbox" data-path="${fullPath}"></div>
            <div class="col-name"><i class="${iconClass}"></i><span>${item.name}</span></div>
            <div class="col-type">${item.file_type_str}</div>
            <div class="col-perms">${item.permissions}</div>
            <div class="col-modified">${formatTimestamp(item.last_modified)}</div>
            <div class="col-size">${item.type === 'file' ? formatBytes(item.size) : ''}</div>
        `;
        li.addEventListener('click', (e) => { 
            if (e.target.type !== 'checkbox') {
                setFocus(index);
                updatePreviewPanel(item);
            }
        });
        li.addEventListener('dblclick', (e) => { if (e.target.type !== 'checkbox') handleItemClick(item); });
        li.addEventListener('contextmenu', (e) => handleContextMenu(e, item));
        const checkbox = li.querySelector('.file-item-checkbox');
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) selectedItems.add(fullPath);
            else selectedItems.delete(fullPath);
            updateSelectionUI();
        });
        return li;
    }
    
    async function loadFiles(path) {
        currentPath = path;
        selectedItems.clear();
        updateSelectionUI();
        renderBreadcrumb();
        searchInput.value = '';
        focusedItemIndex = -1;
        hidePreviewPanel();
        try {
            const data = await apiCall(`/api/list?path=${encodeURIComponent(path)}`);
            allFiles = data.items;
            renderFileList();
        } catch (error) {
            console.error("Failed to load files:", error);
            fileListEl.innerHTML = `<li class="empty-message error">Failed to load files. Check server permissions.</li>`;
        }
    }

    function updateSelectionUI() {
        const count = selectedItems.size;
        document.querySelectorAll('.file-item-checkbox').forEach(cb => {
            cb.checked = selectedItems.has(cb.dataset.path);
        });
        if (count > 0) {
            selectionCount.textContent = `${count} item(s) selected`;
            floatingActionBar.classList.add('visible');
        } else {
            floatingActionBar.classList.remove('visible');
        }
        const totalCheckboxes = document.querySelectorAll('.file-item-checkbox').length;
        selectAllCheckbox.checked = count > 0 && count === totalCheckboxes;
        selectAllCheckbox.indeterminate = count > 0 && count < totalCheckboxes;
    }

    async function saveEditorChanges() {
        const content = codeEditor.getValue();
        try {
            await apiCall('/api/save', {
                method: 'POST',
                body: JSON.stringify({ path: currentFilePathInEditor, content: content })
            });
            showToast('File saved successfully!');
            originalEditorContent = content;
            editorHasUnsavedChanges = false;
            return true;
        } catch (e) {
            return false;
        }
    }

    async function closeEditor() {
        if (editorHasUnsavedChanges) {
            const choice = await showUnsavedChangesPrompt();
            if (choice === 'save') {
                if (await saveEditorChanges()) {
                    editorModal.el.style.display = 'none';
                }
            } else if (choice === 'discard') {
                editorHasUnsavedChanges = false;
                editorModal.el.style.display = 'none';
            }
        } else {
            editorModal.el.style.display = 'none';
        }
    }

    async function openEditor(filePath, fileName) {
        currentFilePathInEditor = filePath;
        editorModal.title.textContent = `Edit: ${fileName}`;
        if (!codeEditor) {
            codeEditor = CodeMirror.fromTextArea(editorModal.textarea, {
                lineNumbers: true,
                theme: 'material-darker',
                mode: 'text/plain'
            });
        }
        
        const modeInfo = CodeMirror.findModeByFileName(fileName);
        if (modeInfo) {
            const mode = modeInfo.mode;
            if (!CodeMirror.modes[mode]) {
                try {
                    const script = document.createElement('script');
                    script.src = `https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.15/mode/${mode}/${mode}.min.js`;
                    document.head.appendChild(script);
                    await new Promise((resolve, reject) => {
                        script.onload = resolve;
                        script.onerror = reject;
                    });
                } catch (e) { console.error(`Failed to load mode: ${mode}`); }
            }
            codeEditor.setOption("mode", modeInfo.mime);
        } else {
             codeEditor.setOption("mode", 'text/plain');
        }

        editorModal.el.style.display = 'flex';
        codeEditor.setValue("Loading content...");
        setTimeout(() => codeEditor.refresh(), 1);

        try {
            const data = await apiCall(`/api/read?path=${encodeURIComponent(filePath)}`);
            codeEditor.setValue(data.content);
            originalEditorContent = data.content;
            editorHasUnsavedChanges = false;
            codeEditor.off('change');
            codeEditor.on('change', () => {
                editorHasUnsavedChanges = codeEditor.getValue() !== originalEditorContent;
            });
        } catch(e) {
            codeEditor.setValue(`// Error loading file: ${e.message}`);
        }
        
        editorModal.saveBtn.onclick = saveEditorChanges;
    }

    function handleItemClick(item) {
        const fullPath = `${currentPath}/${item.name}`.replace(/^\//, '');
        const extension = item.name.split('.').pop().toLowerCase();
        
        if (item.type === 'dir') {
            loadFiles(fullPath);
        } else if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension)) {
            openImageViewer(fullPath, item.name);
        } else if (extension === 'pdf') {
            openPdfViewer(fullPath, item.name);
        } else if (['mp4', 'webm', 'mov', 'mp3', 'ogg', 'wav'].includes(extension)) {
            openMediaPlayer(fullPath, item.name, extension);
        } else {
            openEditor(fullPath, item.name);
        }
    }

    function handleContextMenu(e, item) {
        e.preventDefault();
        contextMenuEl.style.display = 'none';
        const fullPath = `${currentPath}/${item.name}`.replace(/^\//, '');
        const isZip = item.name.toLowerCase().endsWith('.zip');
        contextMenuEl.innerHTML = `
            <ul>
                <li class="ctx-open"><i class="fas fa-folder-open"></i> Open</li>
                ${item.type === 'file' ? '<li class="ctx-edit"><i class="fas fa-pencil-alt"></i> Edit</li>' : ''}
                ${item.type === 'file' ? '<li class="ctx-download"><i class="fas fa-download"></i> Download</li>' : ''}
                ${isZip ? '<li class="ctx-extract"><i class="fas fa-box-open"></i> Extract</li>' : ''}
                <li class="ctx-rename"><i class="fas fa-edit"></i> Rename</li>
                <li class="ctx-permissions"><i class="fas fa-shield-alt"></i> Permissions</li>
                <li class="ctx-delete delete"><i class="fas fa-trash"></i> Delete</li>
            </ul>
        `;
        contextMenuEl.style.top = `${e.clientY}px`;
        contextMenuEl.style.left = `${e.clientX}px`;
        contextMenuEl.style.display = 'block';
        
        const hideMenu = () => contextMenuEl.style.display = 'none';

        contextMenuEl.querySelector('.ctx-open').addEventListener('click', () => { hideMenu(); handleItemClick(item); });
        if (item.type === 'file') {
            contextMenuEl.querySelector('.ctx-edit').addEventListener('click', () => { hideMenu(); openEditor(fullPath, item.name); });
            contextMenuEl.querySelector('.ctx-download').addEventListener('click', () => { hideMenu(); downloadItem(fullPath); });
        }
        if (isZip) {
            contextMenuEl.querySelector('.ctx-extract').addEventListener('click', () => { hideMenu(); extractItem(fullPath); });
        }
        contextMenuEl.querySelector('.ctx-rename').addEventListener('click', () => { hideMenu(); renameItem(item.name); });
        contextMenuEl.querySelector('.ctx-permissions').addEventListener('click', () => { hideMenu(); openPermissionsModal(fullPath, item.permissions); });
        contextMenuEl.querySelector('.ctx-delete').addEventListener('click', () => { hideMenu(); deleteItems([fullPath]); });
    }

    function downloadItem(filePath) {
        window.location.href = `/api/download?path=${encodeURIComponent(filePath)}`;
    }

    async function renameItem(oldName) {
        const newName = await showInput('Rename Item', oldName);
        if (newName && newName.trim()) {
            const trimmedName = newName.trim();
            if (/[\\/:*?"<>|]/.test(trimmedName)) {
                showToast('Filename contains invalid characters.', 'error');
                return;
            }
            if (trimmedName !== oldName) {
                try {
                    await apiCall('/api/rename', {
                        method: 'POST',
                        body: JSON.stringify({ path: currentPath, old_name: oldName, new_name: trimmedName })
                    });
                    showToast('Item renamed successfully');
                    loadFiles(currentPath);
                } catch (e) { /* apiCall shows toast */ }
            }
        } else if (newName !== null) {
            showToast('Name cannot be empty.', 'error');
        }
    }
    
    async function deleteItems(itemsToDelete) {
        const confirm = await showConfirm('Delete Items?', `Are you sure you want to delete ${itemsToDelete.length} item(s)? This cannot be undone.`, 'danger');
        if (confirm) {
            try {
                const response = await apiCall('/api/delete', {
                    method: 'POST',
                    body: JSON.stringify({ items: itemsToDelete })
                });
                if(response.success) {
                    showToast(response.message);
                    loadFiles(currentPath);
                }
            } catch (e) { /* apiCall shows toast */ }
        }
    }

    async function deleteSelected() {
        await deleteItems([...selectedItems]);
    }

    async function uploadFiles(files) {
        const uploadPromises = Array.from(files).map(file => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('path', currentPath);
            return apiCall('/api/upload', { method: 'POST', body: formData });
        });
        try {
            await Promise.all(uploadPromises);
            showToast(`Successfully uploaded ${files.length} file(s).`);
            loadFiles(currentPath);
        } catch (e) { /* apiCall shows toast */ } 
        finally { fileUploadInput.value = ''; }
    }

    async function createNewItem(type) {
        const placeholder = type === 'dir' ? 'MyFolder' : 'new-file.txt';
        const title = type === 'dir' ? 'Create New Folder' : 'Create New File';
        const name = await showInput(title, placeholder);

        if (name && name.trim()) {
            const trimmedName = name.trim();
            if (/[\\/:*?"<>|]/.test(trimmedName)) {
                showToast('Filename contains invalid characters.', 'error');
                return;
            }

            try {
                const response = await apiCall('/api/create', {
                    method: 'POST',
                    body: JSON.stringify({
                        path: currentPath,
                        name: trimmedName,
                        type: type
                    })
                });
                showToast(response.message);
                loadFiles(currentPath);
            } catch (e) { /* apiCall already shows a toast on error */ }
        } else if (name !== null) {
            showToast('Name cannot be empty.', 'error');
        }
    }
    
    function openImageViewer(filePath, fileName) {
        imageModal.img.src = `/api/download?path=${encodeURIComponent(filePath)}`;
        imageModal.caption.textContent = fileName;
        imageModal.el.style.display = 'flex';
    }

    async function openPermissionsModal(path, currentPerms) {
        permissionsModal.input.value = currentPerms;
        permissionsModal.el.style.display = 'flex';
        
        const onOk = async () => {
            const newPerms = permissionsModal.input.value;
            if (newPerms.match(/^[0-7]{3}$/)) {
                try {
                    await apiCall('/api/chmod', {
                        method: 'POST',
                        body: JSON.stringify({ path: path, permissions: newPerms })
                    });
                    showToast('Permissions updated successfully.');
                    loadFiles(currentPath);
                    cleanup();
                } catch(e) { /* apiCall shows toast */ }
            } else {
                showToast('Invalid permissions format. Use 3 octal digits (e.g., 755).', 'error');
            }
        };
        const onCancel = () => cleanup();
        const cleanup = () => {
            permissionsModal.el.style.display = 'none';
            permissionsModal.okBtn.removeEventListener('click', onOk);
            permissionsModal.cancelBtn.removeEventListener('click', onCancel);
            permissionsModal.closeBtn.removeEventListener('click', onCancel);
        };

        permissionsModal.okBtn.addEventListener('click', onOk);
        permissionsModal.cancelBtn.addEventListener('click', onCancel);
        permissionsModal.closeBtn.addEventListener('click', onCancel);
    }

    async function openMoveCopyModal(action) {
        moveModal.title.textContent = action === 'move' ? 'Move Selected Items' : 'Copy Selected Items';
        moveModal.tree.innerHTML = '<div class="spinner"></div>';
        moveModal.el.style.display = 'flex';

        let selectedPath = null;
        
        function renderTree(nodes, container) {
            const ul = document.createElement('ul');
            nodes.forEach(node => {
                const li = document.createElement('li');
                const nodeEl = document.createElement('div');
                nodeEl.className = 'tree-node';
                nodeEl.innerHTML = `<i class="fas fa-folder"></i> <span>${node.name}</span>`;
                nodeEl.dataset.path = node.path;

                nodeEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.tree-node.selected').forEach(n => n.classList.remove('selected'));
                    nodeEl.classList.add('selected');
                    selectedPath = node.path;
                });
                
                li.appendChild(nodeEl);
                if (node.children && node.children.length > 0) {
                    const childrenUl = renderTree(node.children, li);
                    li.appendChild(childrenUl);
                }
                ul.appendChild(li);
            });
            return ul;
        }

        try {
            const treeData = await apiCall('/api/list_dirs');
            moveModal.tree.innerHTML = '';
            moveModal.tree.appendChild(renderTree(treeData));
        } catch (e) {
            moveModal.tree.innerHTML = '<p>Error loading directory tree.</p>';
            return;
        }

        const onOk = async () => {
            if (selectedPath === null) {
                showToast('Please select a destination folder.', 'error');
                return;
            }
            try {
                await apiCall(`/api/${action}`, {
                    method: 'POST',
                    body: JSON.stringify({ items: [...selectedItems], destination: selectedPath })
                });
                showToast(`Items ${action}ed successfully.`);
                loadFiles(currentPath);
                cleanup();
            } catch (e) { /* apiCall shows toast */ }
        };

        const onCancel = () => cleanup();
        const cleanup = () => {
            moveModal.el.style.display = 'none';
            moveModal.okBtn.removeEventListener('click', onOk);
            moveModal.cancelBtn.removeEventListener('click', onCancel);
            moveModal.closeBtn.removeEventListener('click', onCancel);
        };

        moveModal.okBtn.addEventListener('click', onOk);
        moveModal.cancelBtn.addEventListener('click', onCancel);
        moveModal.closeBtn.addEventListener('click', onCancel);
    }

    async function compressSelected() {
        const name = await showInput('Compress Files', 'archive.zip');
        if (name && name.trim()) {
            try {
                await apiCall('/api/compress', {
                    method: 'POST',
                    body: JSON.stringify({
                        items: [...selectedItems],
                        path: currentPath,
                        name: name.trim()
                    })
                });
                showToast('Files compressed successfully.');
                loadFiles(currentPath);
            } catch (e) { /* apiCall shows toast */ }
        }
    }

    async function extractItem(path) {
        if (await showConfirm('Extract Archive?', `Extract contents of '${path.split('/').pop()}' here?`, 'primary')) {
            try {
                await apiCall('/api/extract', {
                    method: 'POST',
                    body: JSON.stringify({ path: path })
                });
                showToast('Archive extracted successfully.');
                loadFiles(currentPath);
            } catch (e) { /* apiCall shows toast */ }
        }
    }

    function updateFocus() {
        document.querySelectorAll('.file-item, .go-up-item').forEach(el => el.classList.remove('selected'));
        if (focusedItemIndex !== -1) {
            const targetEl = fileListEl.querySelector(`[data-index='${focusedItemIndex}']`);
            if (targetEl) {
                targetEl.classList.add('selected');
                targetEl.scrollIntoView({ block: 'nearest' });
            }
        }
    }

    function setFocus(index) {
        focusedItemIndex = index;
        updateFocus();
    }

    async function updatePreviewPanel(item) {
        if (!item) {
            hidePreviewPanel();
            return;
        }
        previewPanel.el.classList.add('visible');
        previewPanel.name.textContent = item.name;
        
        const fullPath = `${currentPath}/${item.name}`.replace(/^\//, '');
        const extension = item.name.split('.').pop().toLowerCase();
        const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(extension);
        const isText = ['txt', 'py', 'js', 'css', 'html', 'md', 'json'].includes(extension);
        const isPdf = extension === 'pdf';

        previewPanel.visual.innerHTML = `<div class="spinner"></div>`; // Show spinner while loading

        if (isImage) {
            previewPanel.visual.innerHTML = `<img src="/api/download?path=${encodeURIComponent(fullPath)}" alt="Preview">`;
        } else if (isText) {
            try {
                const data = await apiCall(`/api/read?path=${encodeURIComponent(fullPath)}`);
                const code = document.createElement('code');
                code.textContent = data.content.substring(0, 1000); // Limit preview size
                const pre = document.createElement('pre');
                pre.appendChild(code);
                previewPanel.visual.innerHTML = '';
                previewPanel.visual.appendChild(pre);
            } catch (e) {
                previewPanel.visual.innerHTML = `<i class="${getIconForFile(item.name)}"></i>`;
            }
        } else if (isPdf) {
            const canvas = document.createElement('canvas');
            previewPanel.visual.innerHTML = '';
            previewPanel.visual.appendChild(canvas);
            try {
                const pdfDoc = await pdfjsLib.getDocument(`/api/download?path=${encodeURIComponent(fullPath)}`).promise;
                const page = await pdfDoc.getPage(1);
                const viewport = page.getViewport({ scale: 0.5 });
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                await page.render({ canvasContext: context, viewport: viewport }).promise;
            } catch(e) {
                previewPanel.visual.innerHTML = `<i class="${getIconForFile(item.name)}"></i>`;
            }
        } else {
            previewPanel.visual.innerHTML = `<i class="${getIconForFile(item.name)}"></i>`;
        }

        previewPanel.details.innerHTML = `
            <p><strong>Size:</strong> ${formatBytes(item.size)}</p>
            <p><strong>Modified:</strong> ${formatTimestamp(item.last_modified)}</p>
            <p><strong>Permissions:</strong> ${item.permissions}</p>
        `;
    }

    function hidePreviewPanel() {
        previewPanel.el.classList.remove('visible');
        document.querySelectorAll('.file-item.selected').forEach(el => el.classList.remove('selected'));
    }

    async function openPdfViewer(filePath, fileName) {
        pdfModal.title.textContent = fileName;
        pdfModal.el.style.display = 'flex';
        
        const url = `/api/download?path=${encodeURIComponent(filePath)}`;
        let pdfDoc = null, pageNum = 1, pageRendering = false, pageNumPending = null;
        const scale = 1.5;
        const canvas = pdfModal.canvas;
        const ctx = canvas.getContext('2d');

        function renderPage(num) {
            pageRendering = true;
            pdfDoc.getPage(num).then(page => {
                const viewport = page.getViewport({ scale: scale });
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                const renderContext = { canvasContext: ctx, viewport: viewport };
                const renderTask = page.render(renderContext);
                renderTask.promise.then(() => {
                    pageRendering = false;
                    if (pageNumPending !== null) {
                        renderPage(pageNumPending);
                        pageNumPending = null;
                    }
                });
            });
            pdfModal.pageInfo.textContent = `Page ${num} of ${pdfDoc.numPages}`;
        }

        function queueRenderPage(num) {
            if (pageRendering) {
                pageNumPending = num;
            } else {
                renderPage(num);
            }
        }

        const onPrevPage = () => { if (pageNum <= 1) return; pageNum--; queueRenderPage(pageNum); };
        const onNextPage = () => { if (pageNum >= pdfDoc.numPages) return; pageNum++; queueRenderPage(pageNum); };
        
        pdfModal.prevBtn.onclick = onPrevPage;
        pdfModal.nextBtn.onclick = onNextPage;

        pdfjsLib.getDocument(url).promise.then(pdfDoc_ => {
            pdfDoc = pdfDoc_;
            renderPage(pageNum);
        }).catch(err => {
            showToast(`Error loading PDF: ${err.message}`, 'error');
            pdfModal.el.style.display = 'none';
        });
    }

    function openMediaPlayer(filePath, fileName, extension) {
        mediaModal.title.textContent = fileName;
        const isVideo = ['mp4', 'webm', 'mov'].includes(extension);
        const playerType = isVideo ? 'video' : 'audio';
        
        mediaModal.body.innerHTML = `<${playerType} controls autoplay src="/api/download?path=${encodeURIComponent(filePath)}"></${playerType}>`;
        mediaModal.el.style.display = 'flex';
    }

    // --- Event Listeners ---
    selectAllCheckbox.addEventListener('change', () => {
        const allItemPaths = Array.from(document.querySelectorAll('.file-item-checkbox')).map(cb => cb.dataset.path);
        if (selectAllCheckbox.checked) {
            allItemPaths.forEach(path => selectedItems.add(path));
        } else {
            selectedItems.clear();
        }
        updateSelectionUI();
    });

    [imageModal.closeBtn, inputModal.closeBtn, permissionsModal.closeBtn, moveModal.closeBtn, pdfModal.closeBtn, mediaModal.closeBtn].forEach(btn => {
        if (btn) btn.onclick = () => {
            const modal = btn.closest('.modal');
            modal.style.display = 'none';
            if (modal.id === 'media-modal') {
                mediaModal.body.innerHTML = ''; // Stop media playback
            }
        }
    });
    
    editorModal.closeBtn.addEventListener('click', closeEditor);
    btnDeleteSelected.addEventListener('click', deleteSelected);
    btnMoveSelected.addEventListener('click', () => openMoveCopyModal('move'));
    btnCopySelected.addEventListener('click', () => openMoveCopyModal('copy'));
    btnCompressSelected.addEventListener('click', compressSelected);
    btnNewFolder.addEventListener('click', () => createNewItem('dir'));
    btnNewFile.addEventListener('click', () => createNewItem('file'));
    btnUpload.addEventListener('click', () => fileUploadInput.click());
    fileUploadInput.addEventListener('change', (e) => uploadFiles(e.target.files));
    document.addEventListener('click', (e) => {
        if (contextMenuEl.style.display === 'block' && !contextMenuEl.contains(e.target)) {
            contextMenuEl.style.display = 'none';
        }
    });

    searchInput.addEventListener('input', renderFileList);

    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => {
            const key = header.dataset.sort;
            if (currentSort.key === key) {
                currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.key = key;
                currentSort.order = 'asc';
            }
            renderFileList();
        });
    });

    btnListView.addEventListener('click', () => {
        currentView = 'list';
        fileListEl.classList.remove('grid-view');
        document.querySelector('.file-list-header').style.display = 'flex';
        btnListView.classList.add('active');
        btnGridView.classList.remove('active');
    });

    btnGridView.addEventListener('click', () => {
        currentView = 'grid';
        fileListEl.classList.add('grid-view');
        document.querySelector('.file-list-header').style.display = 'none';
        btnGridView.classList.add('active');
        btnListView.classList.remove('active');
    });

    previewPanel.closeBtn.addEventListener('click', hidePreviewPanel);

    // Drag and Drop
    let dragCounter = 0;
    document.body.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter++;
        dragOverlay.classList.add('visible');
    });
    document.body.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter--;
        if (dragCounter === 0) {
            dragOverlay.classList.remove('visible');
        }
    });
    document.body.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
    document.body.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter = 0;
        dragOverlay.classList.remove('visible');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            uploadFiles(files);
        }
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        const activeEl = document.activeElement;
        if (['INPUT', 'TEXTAREA'].includes(activeEl.tagName) || (codeEditor && codeEditor.hasFocus())) {
            return;
        }

        const visibleItems = Array.from(fileListEl.querySelectorAll('.file-item'));
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            focusedItemIndex = Math.min(focusedItemIndex + 1, visibleItems.length - 1);
            updateFocus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            focusedItemIndex = Math.max(focusedItemIndex - 1, 0);
            updateFocus();
        } else if (e.key === 'Enter' && focusedItemIndex !== -1) {
            e.preventDefault();
            const focusedItemData = allFiles[focusedItemIndex];
            if (focusedItemData) handleItemClick(focusedItemData);
        } else if (e.key === 'Delete' && selectedItems.size > 0) {
            e.preventDefault();
            deleteSelected();
        } else if (e.key === 'F2' && focusedItemIndex !== -1) {
            e.preventDefault();
            const focusedItemData = allFiles[focusedItemIndex];
            if (focusedItemData) renameItem(focusedItemData.name);
        } else if (e.ctrlKey && e.shiftKey && e.key === 'N') {
            e.preventDefault();
            createNewItem('dir');
        }
    });
    
    // --- Initial Load ---
    loadFiles('');
});
