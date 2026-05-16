def split_sql_statements(sql):
    statements = []
    current = []
    in_single_quote = False
    in_double_quote = False

    for char in sql:
        if char == "'" and not in_double_quote:
            in_single_quote = not in_single_quote
        elif char == '"' and not in_single_quote:
            in_double_quote = not in_double_quote

        if char == ";" and not in_single_quote and not in_double_quote:
            statement = "".join(current).strip()
            if statement:
                statements.append(statement)
            current = []
            continue

        current.append(char)

    statement = "".join(current).strip()
    if statement:
        statements.append(statement)

    return statements


def apply_schema_file(engine, schema_path):
    schema_sql = schema_path.read_text(encoding="utf-8")
    statements = split_sql_statements(schema_sql)
    raw_conn = engine.raw_connection()

    try:
        with raw_conn.cursor() as cursor:
            for index, statement in enumerate(statements, start=1):
                try:
                    cursor.execute(statement)
                except Exception:
                    raw_conn.rollback()
                    print(f"Schema failed at statement {index}:")
                    print(statement)
                    raise

        raw_conn.commit()
    finally:
        raw_conn.close()

    return len(statements)


def grid_size_token(grid_cell_size_deg):
    return str(grid_cell_size_deg).rstrip("0").rstrip(".").replace(".", "p")


def global_grid_id(lat, lon, grid_cell_size_deg, country_code="IN"):
    lat_index = round((float(lat) + 90.0) / float(grid_cell_size_deg))
    lon_index = round((float(lon) + 180.0) / float(grid_cell_size_deg))
    return f"{country_code}_{grid_size_token(grid_cell_size_deg)}_{lat_index}_{lon_index}"
