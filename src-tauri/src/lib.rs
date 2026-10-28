mod commands;

use commands::file_ops;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            file_ops::read_file,
            file_ops::write_file,
            file_ops::open_url,
            file_ops::read_directory,
            file_ops::get_recent_files,
            file_ops::add_recent_file,
            file_ops::generate_example,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
