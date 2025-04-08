# MAIN

> [!TIP]
> Tasks are manually added to the APP.

## Requisites

### Software

- [Visual Studio Code](https://code.visualstudio.com/) _(WSL)_
- [Node Version Manager](https://github.com/nvm-sh/nvm) > `(v22.14.0)`

### Deployment

- [Vercel](https://vercel.com/)

### AI API Keys

- [Open Router](https://openrouter.ai/)

### Database

- [Supabase](https://supabase.com/)

## How to set up

Once you have everything necessary installed, download this repo:

```bash

$ git clone git@github.com:RaulSanchezzt/tech.git

$ cd tech

```

Then, install the `node_modules`...

```bash
$ npm install
```

Finally, run this command to set up in _local_:

```bash
$ npm run dev

> tech@0.1.0 dev
> next dev

   ▲ Next.js 15.2.3
   - Local:        http://localhost:3000
   - Network:      http://10.255.255.254:3000
   - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 2.1s
```

> [!NOTE]
> Remember to add your own **Open Router AI API** key to `.env.local`

## Features

- [x] Deployed live on Vercel

### Frontend

- [x] Simple Frontend with 3 tasks
- [x] Add current streak of days
- [x] Progressive Web App (PWA)
- [ ] Add motivational phrases
- [x] Add log-in / sign-in menu

### Backend

- [x] Each day 3x tasks are assigned to each user
- [ ] If a user completes the tasks the streak continues
- [ ] Add Push notifications
- [ ] Add Coins and rewards

### Database

- [x] Create database to store user and auth
- [x] Store the tasks of each user by date and progress
- [x] Save the streak of days for each user
- [ ] Store the available tasks and their compensation
- [ ] Store the customes available
- [ ] Store the customes each user have purchased
- [ ] Save which customes are wearing each user

## Design

- [ ] Mail link -> Override Supabase default template
- [ ] Main page -> It only has a black page for the moment
- [ ] Think of a domain name and name APP!
- [ ] Design more costumes

---

## Config

Here you can see how was this project configured at the begining:

```bash
$ npx create-next-app tech --javascript
Need to install the following packages:
  create-next-app@15.2.3
Ok to proceed? (y) y
✔ Would you like to use ESLint? … No
✔ Would you like to use Tailwind CSS? … Yes
✔ Would you like your code inside a `src/` directory? … No
✔ Would you like to use App Router? (recommended) … No
✔ Would you like to use Turbopack for `next dev`? … No
✔ Would you like to customize the import alias (`@/*` by default)? … No
Creating a new Next.js app in /home/raul/tech.

Using npm.

Initializing project with template: default-tw


Installing dependencies:
- react
- react-dom
- next

Installing devDependencies:
- @tailwindcss/postcss
- tailwindcss
```
