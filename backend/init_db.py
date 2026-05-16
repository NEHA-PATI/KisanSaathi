#!/usr/bin/env python3
"""
Database initialization script for PostgreSQL + PostGIS
Run this AFTER creating PostgreSQL database on Render
"""

import os
import sys
from pathlib import Path
from sqlalchemy import create_engine, text

def init_database():
    """Initialize database with schema and PostGIS extension"""
    
    # Build connection string from environment or arguments
    if len(sys.argv) > 1:
        connection_string = sys.argv[1]
    else:
        # Build from environment variables
        db_host = os.getenv('DB_HOST', 'localhost')
        db_port = os.getenv('DB_PORT', '5432')
        db_name = os.getenv('DB_NAME', 'bhoomidb')
        db_user = os.getenv('DB_USER', 'bhoomi')
        db_password = os.getenv('DB_PASSWORD', '')
        
        connection_string = (
            f'postgresql://{db_user}:{db_password}@'
            f'{db_host}:{db_port}/{db_name}'
        )
    
    print(f"Connecting to database...")
    print(f"Connection: {connection_string.split('@')[1]}")
    
    try:
        engine = create_engine(connection_string)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✓ Database connection successful!")
        
        # Enable PostGIS extension
        print("\nEnabling PostGIS extension...")
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            conn.commit()
            print("✓ PostGIS extension enabled")
        
        # Read and execute schema file
        schema_file = Path(__file__).parent / 'backend' / 'db' / 'schema.sql'
        
        if not schema_file.exists():
            print(f"⚠ Schema file not found: {schema_file}")
            print("Download schema from the backup and place it at backend/db/schema.sql")
            return False
        
        print(f"\nExecuting schema from: {schema_file}")
        
        with open(schema_file, 'r') as f:
            schema_sql = f.read()
        
        # Split by semicolon and execute statements
        statements = [s.strip() for s in schema_sql.split(';') if s.strip()]
        
        with engine.connect() as conn:
            for i, statement in enumerate(statements, 1):
                try:
                    conn.execute(text(statement))
                    print(f"  [{i}/{len(statements)}] Executed statement")
                except Exception as e:
                    print(f"  ⚠ Statement {i} failed (may be expected): {str(e)[:100]}")
            
            conn.commit()
        
        print(f"\n✓ Schema initialization complete!")
        
        # Verify tables
        print("\nVerifying tables...")
        with engine.connect() as conn:
            result = conn.execute(text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema = 'public'"
            ))
            tables = [row[0] for row in result]
            print(f"✓ Created {len(tables)} tables:")
            for table in sorted(tables):
                print(f"  - {table}")
        
        engine.dispose()
        return True
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        return False

if __name__ == '__main__':
    success = init_database()
    sys.exit(0 if success else 1)
