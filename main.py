# Project: file_manager
# File Path: file_manager/main.py
# Last Updated: 2025-08-08 07:15:00

from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import shutil
import stat
import mimetypes
import zipfile
import io

app = Flask(__name__, static_folder='static', template_folder='templates')
ROOT_DIR = "/app/files"
os.makedirs(ROOT_DIR, exist_ok=True)

def get_full_path(path):
    safe_path = os.path.normpath(os.path.join(ROOT_DIR, path.lstrip('/\\')))
    if not safe_path.startswith(os.path.realpath(ROOT_DIR)):
        raise ValueError("Access denied: Path is outside the allowed directory.")
    return safe_path

def get_file_type(path):
    if os.path.isdir(path):
        return "Folder"
    _, extension = os.path.splitext(path)
    return extension.lower() if extension else "File"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/list', methods=['GET'])
def list_files():
    try:
        path = request.args.get('path', '')
        full_path = get_full_path(path)
        items = []
        for item_name in os.listdir(full_path):
            item_path = os.path.join(full_path, item_name)
            file_stat = os.stat(item_path)
            items.append({
                'name': item_name,
                'type': 'dir' if os.path.isdir(item_path) else 'file',
                'size': file_stat.st_size,
                'last_modified': file_stat.st_mtime,
                'permissions': oct(stat.S_IMODE(file_stat.st_mode))[-3:],
                'file_type_str': get_file_type(item_path)
            })
        return jsonify({'items': items})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/list_dirs', methods=['GET'])
def list_dirs():
    try:
        def get_dirs(root_path, rel_path):
            tree = []
            full_root_path = os.path.join(root_path, rel_path)
            for name in os.listdir(full_root_path):
                full_item_path = os.path.join(full_root_path, name)
                if os.path.isdir(full_item_path):
                    node = {
                        "name": name,
                        "path": os.path.join(rel_path, name),
                        "children": get_dirs(root_path, os.path.join(rel_path, name))
                    }
                    tree.append(node)
            return tree
        dir_tree = [{"name": "Root", "path": "", "children": get_dirs(ROOT_DIR, '')}]
        return jsonify(dir_tree)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/read', methods=['GET'])
def read_file():
    try:
        path = request.args.get('path', '')
        full_path = get_full_path(path)
        if os.path.isfile(full_path):
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            return jsonify({'content': content})
        return jsonify({'error': 'Not a file'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ... (save, upload, create, delete, rename, chmod, move, copy, download routes remain the same)
@app.route('/api/save', methods=['POST'])
def save_file():
    try:
        data = request.json
        path = data.get('path', '')
        content = data.get('content', '')
        full_path = get_full_path(path)
        if os.path.isfile(full_path):
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return jsonify({'success': True, 'message': 'File saved successfully!'})
        return jsonify({'error': 'Not a file'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    try:
        path = request.form.get('path', '')
        full_path = get_full_path(path)
        if 'file' not in request.files:
            return jsonify({'error': 'No file part in the request'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected for uploading'}), 400
        if file:
            filename = file.filename
            destination = os.path.join(full_path, filename)
            file.save(destination)
            return jsonify({'success': True, 'message': f"File '{filename}' uploaded successfully."})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/create', methods=['POST'])
def create_item():
    try:
        data = request.json
        path = data.get('path', '')
        name = data.get('name')
        item_type = data.get('type')
        full_path = os.path.join(get_full_path(path), name)

        if os.path.exists(full_path):
            return jsonify({'error': f"'{name}' already exists."}), 400

        if item_type == 'dir':
            os.makedirs(full_path)
            message = f"Folder '{name}' created."
        elif item_type == 'file':
            open(full_path, 'a').close()
            message = f"File '{name}' created."
        else:
            return jsonify({'error': 'Invalid type'}), 400
        return jsonify({'success': True, 'message': message})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete', methods=['POST'])
def delete_items():
    try:
        data = request.json
        items = data.get('items', [])
        for item_path in items:
            full_path = get_full_path(item_path)
            if os.path.isdir(full_path):
                shutil.rmtree(full_path)
            elif os.path.isfile(full_path):
                os.remove(full_path)
        return jsonify({'success': True, 'message': f'{len(items)} item(s) deleted.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/rename', methods=['POST'])
def rename_item():
    try:
        data = request.json
        path = data.get('path', '')
        old_name = data.get('old_name')
        new_name = data.get('new_name')
        old_full_path = get_full_path(os.path.join(path, old_name))
        new_full_path = get_full_path(os.path.join(path, new_name))
        os.rename(old_full_path, new_full_path)
        return jsonify({'success': True, 'message': f"Renamed to '{new_name}'."})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chmod', methods=['POST'])
def chmod_item():
    try:
        data = request.json
        path = data.get('path', '')
        permissions = data.get('permissions')
        full_path = get_full_path(path)
        os.chmod(full_path, int(permissions, 8))
        return jsonify({'success': True, 'message': f'Permissions for {os.path.basename(path)} set to {permissions}.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/move', methods=['POST'])
def move_items():
    try:
        data = request.json
        items = data.get('items', [])
        destination_path = data.get('destination')
        full_dest_path = get_full_path(destination_path)
        for item_path in items:
            source_path = get_full_path(item_path)
            dest = os.path.join(full_dest_path, os.path.basename(source_path))
            shutil.move(source_path, dest)
        return jsonify({'success': True, 'message': f'{len(items)} item(s) moved successfully.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/copy', methods=['POST'])
def copy_items():
    try:
        data = request.json
        items = data.get('items', [])
        destination_path = data.get('destination')
        full_dest_path = get_full_path(destination_path)
        for item_path in items:
            source_path = get_full_path(item_path)
            dest = os.path.join(full_dest_path, os.path.basename(source_path))
            if os.path.isdir(source_path):
                shutil.copytree(source_path, dest)
            else:
                shutil.copy2(source_path, dest)
        return jsonify({'success': True, 'message': f'{len(items)} item(s) copied successfully.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/download')
def download_file():
    try:
        path = request.args.get('path', '')
        full_path = get_full_path(path)
        if os.path.isfile(full_path):
            directory = os.path.dirname(full_path)
            filename = os.path.basename(full_path)
            return send_from_directory(directory, filename, as_attachment=True)
        return "File not found", 404
    except Exception as e:
        return str(e), 500

@app.route('/api/compress', methods=['POST'])
def compress_items():
    try:
        data = request.json
        items = data.get('items', [])
        path = data.get('path', '')
        archive_name = data.get('name', 'archive.zip')
        
        full_path = get_full_path(path)
        zip_path = os.path.join(full_path, archive_name)

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for item_path_rel in items:
                full_item_path = get_full_path(item_path_rel)
                arcname = os.path.basename(full_item_path)
                if os.path.isdir(full_item_path):
                    for root, _, files in os.walk(full_item_path):
                        for file in files:
                            file_to_zip = os.path.join(root, file)
                            zipf.write(file_to_zip, os.path.join(arcname, os.path.relpath(file_to_zip, full_item_path)))
                else:
                    zipf.write(full_item_path, arcname)

        return jsonify({'success': True, 'message': f"'{archive_name}' created successfully."})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/extract', methods=['POST'])
def extract_item():
    try:
        data = request.json
        path = data.get('path', '')
        full_path = get_full_path(path)
        
        if not zipfile.is_zipfile(full_path):
            return jsonify({'error': 'Not a valid zip file.'}), 400

        extract_dir = os.path.splitext(full_path)[0]
        os.makedirs(extract_dir, exist_ok=True)

        with zipfile.ZipFile(full_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
            
        return jsonify({'success': True, 'message': f"Extracted to '{os.path.basename(extract_dir)}'."})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5006, debug=True)
