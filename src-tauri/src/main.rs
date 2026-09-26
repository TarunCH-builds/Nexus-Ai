// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct DesktopSystemInfo {
    platform: String,
    arch: String,
    snapdragon_accelerated: bool,
    npu_driver_active: bool,
}

#[tauri::command]
fn get_desktop_system_info() -> DesktopSystemInfo {
    let os = std::env::consts::OS;
    let arch = std::env::consts::ARCH;
    let is_arm64 = arch == "aarch64" || arch == "arm";
    let is_windows = os == "windows";

    DesktopSystemInfo {
        platform: os.to_string(),
        arch: arch.to_string(),
        snapdragon_accelerated: is_arm64 && is_windows,
        npu_driver_active: is_arm64 && is_windows,
    }
}

#[tauri::command]
fn minimize_window(window: tauri::Window) {
    let _ = window.minimize();
}

#[tauri::command]
fn toggle_maximize_window(window: tauri::Window) {
    if let Ok(is_maximized) = window.is_maximized() {
        if is_maximized {
            let _ = window.unmaximize();
        } else {
            let _ = window.maximize();
        }
    }
}

#[tauri::command]
fn close_window(window: tauri::Window) {
    let _ = window.close();
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_desktop_system_info,
            minimize_window,
            toggle_maximize_window,
            close_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
