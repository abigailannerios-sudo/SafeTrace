import sqlite3  #built-in SQLite database drive
from contextlib import contextmanager #ensures database automatically opened and closed w/o memory leaks
from pathlib import Path #modern object-oriented file path utility


# Path to database file in same directory
DB_PATH = Path(__file__).parent / "safestay.db"




@contextmanager
def get_db():
   
    """Context manager for database connections.
    Ensures transactions are committed on success,
    rolled back on error, and connections are always closed."""


    conn = sqlite3.connect(DB_PATH)
    # Enable accessing columns by name (e.g. row["item_name"]) instead of index
    conn.row_factory = sqlite3.Row
    # Enforce foreign key constraints in SQLite
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()




def init_db():
    """Creates the database tables if they do not already exist."""
    with get_db() as conn:
        cursor = conn.cursor()


        # 1. INVENTORY TABLE
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS inventory (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                category TEXT NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 0,
                unit TEXT NOT NULL,
                minimum INTEGER NOT NULL DEFAULT 5
            );
            """
        )


        # 2. DONATIONS TABLE (Inbound records)
        # Note: donor_name is a simple nullable string.
        # If your team decides to drop donor info later, this field can easily be ignored or removed!
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS donations (
                id TEXT PRIMARY KEY,
                donor_name TEXT,
                item_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                date_received TEXT NOT NULL,
                status TEXT NOT NULL CHECK(status IN ('Received', 'Distributed', 'Pending'))
            );
            """
        )


        # 3. DISTRIBUTIONS TABLE (Outbound records)
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS distributions (
                id TEXT PRIMARY KEY,
                item_name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                beneficiary TEXT NOT NULL,
                date_distributed TEXT NOT NULL,
                notes TEXT
            );
            """
        )


        # 4. USERS TABLE (Admin Authentication)
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'admin'
            );
            """
        )
        print("Database schema successfully initialized.")




if __name__ == "__main__":
    init_db()
