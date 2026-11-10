use serde::{Deserialize, Serialize};
use std::path::Path;
use walkdir::WalkDir;

#[derive(Serialize, Deserialize, Debug)]
pub struct MediaItem {
    pub id: usize,
    pub title: String,
    pub path: String,
    pub media_type: String,
    pub category: String,
    pub size: u64,
}

#[tauri::command]
pub fn scan_directory(dir_path: String) -> Result<Vec<MediaItem>, String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return Err("Directory does not exist".into());
    }

    let mut items = Vec::new();
    let mut id_counter = 1;

    for entry in WalkDir::new(path).into_iter().filter_map(|e| e.ok()) {
        let p = entry.path();
        if p.is_file() {
            if let Some(ext) = p.extension().and_then(|e| e.to_str()) {
                let ext_lower = ext.to_lowercase();
                let (media_type, category) = match ext_lower.as_str() {
                    "mp4" | "mkv" | "avi" | "mov" | "webm" => ("video", "Movies"),
                    "mp3" | "flac" | "wav" | "aac" | "ogg" => ("audio", "Music"),
                    "jpg" | "jpeg" | "png" | "webp" | "gif" => ("image", "Photos"),
                    "pdf" | "txt" | "docx" | "md" => ("document", "Documents"),
                    _ => continue,
                };

                let metadata = match std::fs::metadata(p) {
                    Ok(m) => m,
                    Err(_) => continue,
                };

                let title = p.file_stem()
                    .and_then(|s| s.to_str())
                    .unwrap_or("Unknown")
                    .to_string();

                items.push(MediaItem {
                    id: id_counter,
                    title,
                    path: p.to_string_lossy().into_owned(),
                    media_type: media_type.to_string(),
                    category: category.to_string(),
                    size: metadata.len(),
                });

                id_counter += 1;
            }
        }
    }

    Ok(items)
}