import { API_URL } from '../constants';

/**
 * APIs that can be used as input by components.
 *
 * Each API object describes an API endpoint. This is the structure:

 @param {string} url
    An endpoint. Needs to start with the http protocol.
    It is possible to create permutations of the URL using
    this fancy bracket syntax: example.com/{{data.*.id}}, where
    "data" is declared in the same object, aside with url and the
    next parameters described below. Examples of this:
      - ```javascript
{
    url: 'example.com/{{data.*.id}}/anotherone/{{data.*.id}}',
    data: { first: {id: 1}, second: {id: 2} },
}
// This generates these URLs:
// 'example.com/1/anotherone/1'
// 'example.com/2/anotherone/1'
// 'example.com/1/anotherone/2'
// 'example.com/2/anotherone/2'
```

    You can also specify the request type using a postfix #TYPE.
    This type can be:
      - #GET (JSON => JSON)
      - #POST[#body] (JSON => JSON)
      - #RSS (XML => JSON)
      - #HTML[:query-selector[(at)attribute]] (HTML => HTML)
      - #TEXT (Plain text => Plain text)
    Any part of the URL can be permuted, meaning stuff can get
    really complex. Especially when involving types.

 @param {integer?} [interval=0]
    Number of seconds to wait before making a new request.

 @param {integer?} [delay=0]
    Number of seconds until the request feed starts.

 @param {object?} transform
    Mapping output data from API to a custom structure
    using STJS, which is kind of genius: https://selecttransform.github.io/site/

 @param {array?} [scrape=[]]
    Array telling what paths in the transform (^) to scrape. The paths in the
    transform needs to have a piece of '[[{{link}}#HTML:selector(at)attribute]]'
   Example for scrape:
            scrape: ['articles.*.image'],
            transform: {
              articles: {
                '{{#each rss.channel[0].item}}': {
                  ...
                  image: '[[{{link[0]}}#HTML:.group-image img@src]]',
                },
              },
            }

 @param {object?} [request={}]
    Specify any params into the fetch request. You can read more about what
    to place here at https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch.

 @param {string|object?} body
     Object or string that get passed into the request. Same as setting the
     request.body value. A small detail that is not obvious is that the
     body (or payload) is appended to the url param (see url types). This
     is because each URL should be able to permute each body too. Example
     can be found for enturbus in the API list.

 @param {boolean?} print
    Boolean telling the API to output results into the console.log before
    any transformation. Nice for development of transforms.

 @param {boolean?} cache
    Boolean telling the API to keep results from spesific request. Sometimes
    when scraping articles you would want to keep the data for a long time.
    Other times, when fetching realtime data from buses, you do not want to
    use cache.

 @param {boolean?} cors
    Boolean telling the API to allow CORS by prepending a URL. Some of the
    types (#RSS, #HTML and #TEXT) uses this CORS hack by default. Setting this
    parameter will override any defaults.

 @example
```javascript
  minimalexample: {
    url: `https://example.com/api/v1/events`, // Fetches JSON
  },
```

 @example
```javascript
  rssfeedexample: {
    interval: 60,
    cache: true,
    print: true, // Use this in development only

    // Telling API to parse RSS (XML) feed using #RSS as postfix
    url: `https://example.com/feed#RSS`,

    // Tell API to scrape articles.(everything).image in the transform
    scrape: ['articles.*.image'],

    transform: {
      articles: {
        '{{#each rss.channel[0].item}}': {
          title: '{{title[0]}}',
          date: '{{pubDate[0]}}',
          link: '{{link[0]}}',
          author: '{{this["dc:creator"][0]}}',

          // Scrape content inside [[request#TYPE]]
          image: 'http://example.com[[{{link[0]}}#HTML:#header-img@src]]',
        },
      },
    },
  },
```

 @example
```javascript
  postexample: {
    interval: 60,
    delay: 30,
    cors: true,
    url: `https://example.com/api/v1/event#POST`,
    body: {
      title: '{{examples.*}}', // This will create 3 requests with different bodies, but equal URLs.
    },
    examples: ['Example1', 'Example2', 'Example3'],
    transform: {
      events: {
        '{{#each results}}': [
          {
            '{{#if visible}}': {
              startDate: '{{start_date}}',
              endDate: '{{end_date}}',
              title: '{{title}}',
              image: 'https://example.com{{image.wide}}',
            },
          },
        ],
      },
    },
  },
```
 */
export const defaultApis = {
  affiliation: {
    interval: 60,
    url: `${API_URL}/affiliation/{{org.*}}`,
    org: {
      debug: 'DEBUG',
      online: 'online',
      abakus: 'abakus',
      delta: 'delta',
    },
  },
  coffeePots: {
    interval: 60,
    url: `${API_URL}/coffee/{{org.*}}`,
    org: {
      debug: 'DEBUG',
      online: 'online',
      abakus: 'abakus',
      delta: 'delta',
    },
  },
  tarbus: {
    interval: 10,
    url: 'https://atbapi.tar.io/api/v1/departures/{{stops.*.fromCity,toCity}}',
    stops: {
      glossyd: { fromCity: '16010265', toCity: '16011265' },
      samf: { fromCity: '16010476', toCity: '16011476' },
      prof: { fromCity: '16010376', toCity: '16011376' },
    },
    // Using STJS for object mapping (https://www.npmjs.com/package/stjs#2-transform)
    transform: {
      departures: {
        '{{#each departures}}': {
          name: '{{destination}}',
          number: '{{line}}',
          registeredTime: '{{registeredDepartureTime}}',
          scheduledTime: '{{scheduledDepartureTime}}',
          isRealtime: '{{isRealtimeData}}',
        },
      },
    },
  },
  bartebuss: {
    interval: 10,
    offline: true,
    url: 'https://bartebuss.no/api/unified/{{stops.*.fromCity,toCity}}',
    stops: {
      glossyd: { fromCity: '16010265', toCity: '16011265' },
      samf: { fromCity: '16010476', toCity: '16011476' },
    },
  },
  enturbus: {
    interval: 10,
    method: 'POST',
    url: `https://api.entur.org/journeyplanner/2.0/index/graphql`,
    request: {
      headers: {
        'ET-Client-Name': 'onlinentnu-notifier-dev',
      },
      mode: 'cors',
    },
    body: {
      query: `{
        quay(id: "NSR:Quay:{{stops.*.fromCity,toCity}}") {
          name
          estimatedCalls(numberOfDepartures: 20) {
            aimedDepartureTime
            expectedDepartureTime
            realtime
            forBoarding
            destinationDisplay {
              frontText
            }
            serviceJourney {
              line {
                publicCode
              }
            }
          }
        }
      }`,
    },
    stops: {
      glossyd: { fromCity: '75707', toCity: '75708' },
      samf: { fromCity: '73103', toCity: '73101' },
      prof: { fromCity: '71204', toCity: '71195' },
    },
    transform: {
      departures: {
        '{{#each data.quay.estimatedCalls}}': [
          {
            '{{#if forBoarding}}': {
              name: '{{destinationDisplay.frontText}}',
              number: '{{serviceJourney.line.publicCode}}',
              registeredTime: '{{expectedDepartureTime}}',
              scheduledTime: '{{aimedDepartureTime}}',
              isRealtime: '{{realtime}}',
            },
          },
        ],
      },
    },
  },
  onlineEvents: {
    interval: 1000,
    url:
      'https://online.ntnu.no/api/v1/events/?ordering=event_start&event_start__gte=[[now.date]]',
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{event_start}}',
          endDate: '{{event_end}}',
          title: '{{title}}',
          image: 'https://online.ntnu.no{{image.wide}}',
          companyImage: '{{company_event.0.company.image.wide}}',
        },
      },
    },
  },
  abakusEvents: {
    interval: 100,
    url: 'https://lego.abakus.no/api/v1/events/?date_after=[[now.date]]',
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  /* XML
  bergEvents: {
    interval: 100,
    url:
      'https://bergstud.no/feed/', http://broderskabet.no/feed
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
   XML
  broderksabetEvents: {
    interval: 100,
    url:
      'http://broderskabet.no/feed'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  deltaEvents: {
    interval: 100,
    url:
      'http://www.deltahouse.no/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
    XML
  emilEvents: {
    interval: 100,
    url:
      'http://www.emilweb.no/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  emilEvents: {
    interval: 100,
    url:
      'http://www.emilweb.no/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
    Scrape
  hcEvents: {
    interval: 100,
    url:
      'not found'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  ???
  hybridaEvents: {
    interval: 100,
    url:
      'not found'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
      Scrape ???
  janusEvents: {
    interval: 100,
    url:
      'not found'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
    XML
  janusEvents: {
    interval: 100,
    url:
      'http://industrielldesign.com/feed'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  Scrape
  janusEvents: {
    interval: 100,
    url:
      'https://mannhullet.no/arrangement'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  Scrape
  mannhulletEvents: {
    interval: 100,
    url:
      'https://mannhullet.no/arrangement'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  Use facebook events evt finne deres api
  omegaEvents: {
    interval: 100,
    url:
      ''
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  Scrape?
    subaffiliation of Omega
  omegavEvents: {
    interval: 100,
    url:
      ''
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  nablaEvents: {
    interval: 100,
    url:
      ''
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  
  placeboEvents: {
    interval: 100,
    url:
      ''
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  Google Calender key
  smorekoppenEvents: {
    interval: 100,
    url:
      'https://clients6.google.com/calendar/v3/calendars/l7fsecfdl2c73pp5dh4slomsek@group.calendar.google.com/events?calendarId=l7fsecfdl2c73pp5dh4slomsek%40group.calendar.google.com&singleEvents=true&timeZone=Europe%2FOslo&maxAttendees=1&maxResults=250&sanitizeHtml=true&timeMin=2018-10-29T00%3A00%3A00%2B01%3A00&timeMax=2018-12-03T00%3A00%3A00%2B01%3A00&key=AIzaSyBNlYH01_9Hc5S1J9vuFmu2nUqBZJNAXxs'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  Finnes den?
  industrivinduetEvents: {
    interval: 100,
    url:
      ''
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  Scrape ??
  solanEvents: {
    interval: 100,
    url:
      'http://solanlinjeforening.no'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  ???
  solanEvents: {
    interval: 100,
    url:
      'http://spanskroret.no/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  ???
  spanskroretEvents: {
    interval: 100,
    url:
      'http://spanskroret.no/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  Scrape?
  timiniEvents: {
    interval: 100,
    url:
      'https://www.timini.no//frontpage/ajax-get-initial?'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  volvoxEvents: {
    interval: 100,
    url:
      'http://org.ntnu.no/volvox/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  cafEvents: {
    interval: 100,
    url:
      'https://cafidrett.wordpress.com/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
   XML
  communitasEvents: {
    interval: 100,
    url:
      'https://sosantntnu.wordpress.com/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  dhsEvents: {
    interval: 100,
    url:
      'http://ntnuhistorie.wordpress.com/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  dionysosEvents: {
    interval: 100,
    url:
      'http://dionysosntnu.wordpress.com/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  Api funker ikke?
  erudioEvents: {
    interval: 100,
    url:
      'https://www.erudiontnu.no/api/census/RecordHit?crumb=BaN0gkc77cTcNjgwMzJiYTA5YTkxMzUzYzFhMTJmZjMxYTAyNmIy'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  Scrape?
  eurekaEvents: {
    interval: 100,
    url:
      ''
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  ?
  geolfEvents: {
    interval: 100,
    url:
      ''
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  gengangereEvents: {
    interval: 100,
    url:
      'https://www.facebook.com/pg/linjeforeningengangere/posts/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  jumpcutEvents: {
    interval: 100,
    url:
      'https://www.facebook.com/pg/linjeforeningengangere/posts/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  paideiaEvents: {
    interval: 100,
    url:
      'https://paideiantnu.wordpress.com/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  paideiaEvents: {
    interval: 100,
    url:
      'https://paideiantnu.wordpress.com/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  panoptikonEvents: {
    interval: 100,
    url:
      'http://panoptikonlinjeforening.wordpress.com/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  ikke tilgang til serveren :D
  paretoEvents: {
    interval: 100,
    url:
      ''
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  primetimeEvents: {
    interval: 100,
    url:
      'https://primetimentnu.com/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  Facebook
  psiEvents: {
    interval: 100,
    url:
      'https://www.facebook.com/psi.linjeforening/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  psykolosjenEvents: {
    interval: 100,
    url:
      'https://psykolosjen.com/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  Facebook
  sturmunddrangEvents: {
    interval: 100,
    url:
      'https://www.facebook.com/SturmUndDrangNTNU/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  teaterlosjenEvents: {
    interval: 100,
    url:
      'http://teaterlosjen.wordpress.com/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  universitetsteateretEvents: {
    interval: 100,
    url:
      'http://universitetsteatret.wordpress.com/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  kjemiogmaterialEvents: {
    interval: 100,
    url:
      'https://kjemiogmaterial.wordpress.com/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  logitasEvents: {
    interval: 100,
    url:
      'http://www.logitas.no/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  støhEvents: {
    interval: 100,
    url:
      'http://www.sftoh.no/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  tim_og_shaenkoEvents: {
    interval: 100,
    url:
      'https://bygging.no/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  tjsfEvents: {
    interval: 100,
    url:
      'https://www.tjsf.co/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  vivasEvents: {
    interval: 100,
    url:
      'https://www.facebook.com/VivasNTNU/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  dionEvents: {
    interval: 100,
    url:
      'http://org.ntnu.no/dion/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  */

  /*usikker på om jeg satte api vediene riktig*/
  esnArticles: {
    interval: 100,
    url: 'https://trondheim.esn.no/rss.xml#RSS',
    scrape: ['articles.*.image'],
    cache: true,
    transform: {
      articles: {
        '{{#each rss.channel[0].item}}': {
          title: '{{title[0]}}',
          date: '{{pubDate[0]}}',
          link: '{{link[0]}}',
          author: '{{this["dc:creator"][0]}}',
          image: '[[{{link[0]}}#HTML:.group-image img@src]]',
        },
      },
    },
  },
 esnEvents: {
  interval: 100,
  url:
    'https://sales-embed.hoopla.no/api/v2.0/public/organizations/58861643/events',
    cors: true,
  transform: {
    events: {
        '{{#each data}}': {
        startDate: '{{start}}',
        endDate: '{{end}}',
          title: '{{name}}',
          image:
            '//hoopla.imgix.net/production/{{data.image}}?auto=format,compress&rect=108,7,843,527&h=80',
      },
    },
  },
},
/*
XML eller facebook
  iaesteEvents: {
    interval: 100,
    url:
      'https://iaeste.no/no/feed/, https://www.facebook.com/INTrondheim/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  facebook
  isuEvents: {
    interval: 100,
    url:
      'https://www.facebook.com/ISU-Trondheim-709614882492680/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
    //
   //Studentmedier
  //
  XML
  duskenEvents: {
    interval: 100,
    url:
      'https://dusken.no/feed'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  universitetsavisaEvents: {
    interval: 100,
    url:
      'http://www.universitetsavisa.no/?widgetName=polarisFeeds&widgetId=40853&getXmlFeed=true'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  geminiEvents: {
    interval: 100,
    url:
      'https://gemini.no/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
    //
   //Samfundet, Studentdemokrati
  //
  XML
  samfundetEvents: {
    interval: 100,
    url:
      'https://www.samfundet.no/arrangement/rss'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  velferdstingetEvents: {
    interval: 100,
    url:
      'https://velferdstinget.no/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },
  XML
  studenttingetEvents: {
    interval: 100,
    url:
      'https://studenttinget.no/feed/'
    transform: {
      events: {
        '{{#each results}}': {
          startDate: '{{startTime}}',
          title: '{{title}}',
          image: '{{cover}}',
        },
      },
    },
  },

  //
 //Utdanningsinstitusjoner
//
//fant ikke ntnu feed
  XML
  dmmhEvents: {
    interval: 100,
    url:
      'https://dmmh.no/hva-skjer?rss=true'
  },
  */
  deltaArticles: {
    interval: 43200,
    url: 'http://www.deltahouse.no/feed/#RSS',
    cache: true,
    transform: {
      articles: {
        '{{#each rss.channel[0].item}}': {
          title: '{{title[0]}}',
          date: '{{pubDate[0]}}',
          link: '{{link[0]}}',
          author: '{{this["dc:creator"][0]}}',
          image:
            'https://www.deltahouse.no/wp-content/themes/delta/dist/images/logo.svg',
        },
      },
    },
  },
  dusken: {
    interval: 43200,
    url: 'https://dusken.no/feed#RSS',
    print: true,
    cache: true,
    scrape: ['articles.*.image'],
    transform: {
      articles: {
        '{{#each rss.channel[0].item}}': {
          title: '{{title[0]}}',
          date: '{{pubDate[0]}}',
          link: '{{link[0]}}',
          author: 'Dusken.no',
          image: 'http://dusken.no[[{{link[0]}}#HTML:#header-img@src]]',
        },
      },
    },
  },
};
