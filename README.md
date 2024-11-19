# Football Fantasy Web app

Full stack web application for playing football fantasy within my univsersity football league along with other features such as an upcoming fixtures display and players stat tables.

Uses Django-React framework with axios for streamlining API communcation.

Uses AWS EC2, S3 and Cloudfront for current deployment at www.langwithfootball.com

# Local Installation & Usage

First, in frontend/.env set

```bash
VITE_API_URL='http://localhost:8000/'
```


To run frontend

```bash
cd frontend
npm install
npm run dev
```

And terminal will show running local link, typically http://localhost:8000/

To run backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py runserver
```

And backend will be runnning at http://localhost:8000/

[![My Tech Stack](https://github-readme-tech-stack.vercel.app/api/cards?lineCount=1&theme=github&line1=react%2Creact%2C263f7e%3BDjango%2Cdjango%2Cdccf16%3BAxios%2Caxios%2C13a11c%3BJavascript%2CJavascript%2Cc41ca7%3BAWS%2CAWS%2Cd47f13%3BPython%2CPython%2C1da2a7%3B)

# Improvements

Improvements will continue to be made, starting with adapting the website to be easier to use and compatible with mobile web searchers. Hopefully even an app will follow soon...
