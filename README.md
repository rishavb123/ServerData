# Server Data

This application is being hosted at [data.bhagat.io]

This code is being hosted on Github in a repository called [ServerData]

`git pull https://github.com/rishavb123/ServerData.git`

## Videos

I created two videos to demo my project. I have a long version of the
video and a short one. The long version is around 11 and a half minutes
long and it covers almost all the features and touches a little bit on
how some parts of the code works. On the other hand, the shortened video
goes a lot faster and only covers the more unique features of the web
app. I also have the clips for each feature stored in the clips folder.

### Full Video

To access the Full Video open `Video/full.mp4`

### Short Video

To access the Small Video open `Video/small.mp4`


### Clips

Each clip describes a few features. The name of the file indicates the
feature that it talks about. The number in the name tells you what order
it shows up in the full video. To view these videos open `Video/clips`
and then choose the clip to watch.

## Diagrams

These are a few images that I created during development to either map
out how something would look/work or it was to see how to do the math
for something.

## Website

This is the website that is being hosted at [data.bhagat.io]. Opening
the `index.html` file will not load the website since the site

  [data.bhagat.io]: http://data.bhagat.io
  [ServerData]: https://github.com/rishavb123/ServerData

## React Source

### File(s) Worth Looking At - React

- `React Source/src/App.jsx`
- `React Source/src/firebase.js`
- `React Source/src/data/data.json`
- `React Source/public/index.html`
- `React Source/README.md`

### Install Dependencies

`cd React Source`{.tab3}\
`npm install`{.tab3}

### Start Development Server

`cd React Source`{.tab3}\
`npm start`{.tab3}

### Create Build

`cd React Source`{.tab3}\
`npm run build`{.tab3}

## Server

The server uses python 3.7 to serve the content. It also require a few
modules installed in python: (firebase\_admin, sklean). The server will
also not work without the credentials to connect to the firebase admin
sdk. If it is absolutely required to run the server, email me at
[rishav\@bhagat.io]

### File(s) Worth Looking At - Server

- `Server/server.py`

  [rishav\@bhagat.io]: mailto:rishav@bhagat.io?subject=Need%20Firebase%20Admin%20Service%20Account%20Credentials&body=Hi%20Rishav,%0AWould%20it%20be%20possible%20for%20you%20to%20send%20me%20a%20copy%20of%20the%20Firebase%20Admin%20Service%20Account%20credentials%20so%20that%20I%20can%20run%20and%20test%20the%20python%20server.
