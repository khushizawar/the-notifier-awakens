export const defaultAffiliationSettings = {
  online: {
    settings: ['bus', 'bus2', 'coffee', 'events', 'officestatus'],
    components: [
      {
        template: 'Clock',
        apis: {
          pots: 'coffeePots.org.online:pots',
          message: 'affiliation.org.online:servant.message',
          responsible: 'affiliation.org.online:servant.responsible',
          servants: 'affiliation.org.online:servant.servants',
        },
      },
      {
        template: 'Bus',
        apis: {
          fromCity: 'tarbus.stops.samf.fromCity:departures',
          toCity: 'tarbus.stops.samf.toCity:departures',
        },
      },
    ],
  },
};
