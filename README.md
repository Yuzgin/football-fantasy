# Football Fantasy Web app

Full stack web application for playing football fantasy within my univsersity football league along with other features such as an upcoming fixtures display and players stat tables.

Uses Django-React framework with axios for streamlining API communcation.

Uses AWS EC2, S3 and Cloudfront for current deployment at www.langwithfootball.com




![My Tech Stack](https://github-readme-tech-stack.vercel.app/api/cards?lineCount=2&line1=React%2CReact%2C1321e8%3BDjango%2CDjango%2Ce40d0d%3BAxios%2CAxios%2C8af937%3B&line2=Javascript%2CJavascript%2Cd69b20%3BPython%2CPython%2C43bce7%3B)

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



# Improvements

Improvements will continue to be made, starting with adapting the website to be easier to use and compatible with mobile web searchers. Hopefully even an app will follow soon...
