use tauri::{App, Manager};
use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
    vec![
        // Version 1: Initial tables
        Migration {
            version: 1,
            description: "create_initial_tables",
            sql: "
                CREATE TABLE IF NOT EXISTS media_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    path TEXT UNIQUE NOT NULL,
                    media_type TEXT NOT NULL,
                    category TEXT NOT NULL,
                    size INTEGER NOT NULL,
                    last_played INTEGER DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS user_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
            ",
            kind: MigrationKind::Up,
        },
        // Version 2: Watch history
        Migration {
            version: 2,
            description: "create_watch_history_table",
            sql: "
                CREATE TABLE IF NOT EXISTS watch_history (
                    path TEXT PRIMARY KEY,
                    progress REAL DEFAULT 0,
                    duration REAL DEFAULT 0,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            ",
            kind: MigrationKind::Up,
        },
        // Version 3: Soft-delete status
        Migration {
            version: 3,
            description: "add_soft_delete_to_media_items",
            sql: "
                ALTER TABLE media_items ADD COLUMN is_deleted INTEGER DEFAULT 0;
            ",
            kind: MigrationKind::Up,
        },
    ]
}

pub fn init_database(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    let _handle = app.handle();
    Ok(())
}