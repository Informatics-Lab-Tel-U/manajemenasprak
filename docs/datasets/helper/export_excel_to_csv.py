import os
import pandas as pd
from pathlib import Path

def export_excel_to_csv(dataset_folder):
    # Ensure dataset folder exists
    dataset_path = Path(dataset_folder)
    if not dataset_path.exists():
        print(f"Error: Folder '{dataset_folder}' not found.")
        return

    # Find all xlsx files
    excel_files = list(dataset_path.glob("*.xlsx"))
    
    if not excel_files:
        print(f"No .xlsx files found in '{dataset_folder}'.")
        return

    print(f"Found {len(excel_files)} Excel file(s). Processing...")

    for excel_file in excel_files:
        file_name = excel_file.stem  # e.g., "2425-1"
        output_dir = dataset_path.parent / file_name  # e.g., ../2425-1
        
        # Create output directory
        output_dir.mkdir(parents=True, exist_ok=True)
        print(f"Processing '{excel_file.name}' -> Output folder: '{output_dir}'")

        try:
            # Read all sheets
            xls = pd.ExcelFile(excel_file)
            for sheet_name in xls.sheet_names:
                df = xls.parse(sheet_name)
                
                # Clean sheet name for filename (remove invalid chars if any)
                safe_sheet_name = "".join([c for c in sheet_name if c.isalnum() or c in (' ', '-', '_')]).strip()
                csv_filename = f"{safe_sheet_name}.csv"
                csv_path = output_dir / csv_filename
                
                # Export to CSV
                df.to_csv(csv_path, index=False)
                print(f"  - Exported sheet '{sheet_name}' to '{csv_filename}'")
                
        except Exception as e:
            print(f"  Error processing file '{excel_file.name}': {e}")

if __name__ == "__main__":
    # Assuming the script is run from the project root
    DATASET_DIR = "dataset"
    export_excel_to_csv(DATASET_DIR)
