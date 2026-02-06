---
description: Everytime
# applyTo: 'Describe when these instructions should be loaded' # when provided, instructions will automatically be added to the request context when the pattern matches an attached file
---
- Always use UV to run python commands.
- Always ensure you are inside election folder while running dbt commands.
- Never commit changes or try to push changes leave that task for the user.
- Always test your changes. For data changes take at least few samples and make sure the data matches as what we expect to see. 
- All datamodels are inside election folder. This is the dbt project.
- All raw data are loaded from data/ folder in root directory. They are loaded into duckdb using `scrape_scripts/load_raw_data.py` we don't need to run this again unless we deleted the duckdb file or we want to load new data.
- When we run uv run export_to_json.py it automatically exports the required data into json files inside public/data folder. This is the data that will be used by the frontend. If you make any changes to the data models or if you want to test with new data, you can run this command to export the data again. Do not use browser to check things. Check using json file or commands.
- Whenever we make any changes to any dbt model we run all dbt modes using `uv run dbt build` to make sure everything is working fine. Don't only run the model you changed, run all models to make sure there are no issues with any other models.