Help me plan for a new feature for keywords search.

## purpose
-the keyword search function will start by searching instagram keywords using http request with proxy to google.com. proxy credentials can be seen in @claude.md
-then from the results will be shown in a UI component that the user can select the keywords to save.
-saved keywords from the keyword page should add a button to 
-then the selected keywords will be saved to the database.
-

## instagram scraper
-then the instagram-scraper apify

```code
    # Set API token
    API_TOKEN=<YOUR_API_TOKEN>

    # Prepare Actor input
    cat > input.json <<'EOF'
    {
    "directUrls": [
        "gofood"
    ],
    "resultsType": "hashtag",
    "resultsLimit": 1,
    "searchType": "hashtag",
    "searchLimit": 1,
    "addParentData": false
    }
    EOF

    # Run the Actor
    curl "https://api.apify.com/v2/acts/shu8hvrXbJbY3Eb9W/runs?token=$API_TOKEN" \
    -X POST \
    -d @input.json \
    -H 'Content-Type: application/json'
```

## plan
-to investigate the apify endpoint

## notes
-API token: [SECURE] Use Apify API token from API_KEYS_GLOBAL.md or environment variable APIFY_API_TOKEN