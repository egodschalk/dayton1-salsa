import './Events.css'
import event3 from '../assets/Event-3.jpg'
import event2 from '../assets/Event-2.jpg'
import event1 from '../assets/Event-1.jpg'
import silentdisco from '../assets/silentdisco.jpeg'
import festival from '../assets/Festival.jpeg'
import social from '../assets/social.jpeg'

const eventData = [
   /* {
  id: 1,
        imgUrl: event1,
        title: "Salsa at the Eso",
        date: "Aug 2, 2026",
        time: "4:30 - 8:30 PM",
        location: "916 E McMillan St, Cincinnati, OH 45206",
        eventUrl: 'https://www.facebook.com/events/1054192710342166/?acontext=%7B%22event_action_history%22%3A[%7B%22mechanism%22%3A%22your_upcoming_events_unit%22%2C%22surface%22%3A%22bookmark%22%7D]%2C%22ref_notif_type%22%3Anull%7D'
    },
    {
        id: 2,
        imgUrl: event2,
        title: "Latin Dance Block Party",
        date: "Aug 1, 2026",
        time: "5:30PM - 12AM",
        location: "312 E Main St, Muncie, IN",
        eventUrl: 'https://harmonymovementstudio.redpodium.com/salsa-workshops-with-david-and-heather-sommer'
    },*/
    { 
        id: 3,
        imgUrl: silentdisco,
        title: "Silent Disco Latin Party",
        date: "Sunday, Sept 13, 2026",
        time: "5:00 - 8:00 PM",
        location: "On Par Entertainment, 4464 Indian Ripple Rd",
        info: "3 DJs all night — Salsa, Bachata, and Merengue!",
        eventUrl: ''
    },
    {
        id: 4,
        imgUrl: festival,
        title: "Dayton Hispanic Heritage Festival — 25th Anniversary",
        date: "Saturday, September 19, 2026",
        time: "11:00 AM - 11:00 PM",
        location: "RiverScape MetroPark",
        info: "Live performances, traditional food, art & crafts",
        eventUrl: 'https://pacodayton.com/hispanic-heritage-festival/'
    },
    {
        id: 5,
        imgUrl: social,
        title: "DaytOn1 End of the Month Social",
        date: "Monday, Sept 28, 2026",
        time: "Classes 5:30 PM · Salsa 7:45 PM · Social 8:30 - 10:30 PM",
        location: "On Par Entertainment",
        eventUrl: ''
    },
]

export default function Events() {
    return (
        <div className="events-page">
            <div className='events-content'>
                <h2 className='events-header'>DaytOn1 Events</h2>

                <div className='events-grid'>
                    {eventData.map(event => {
                        const CardInner = (
                            <>
                                <div className='event-card-img'>
                                    <img src={event.imgUrl} alt={event.title} />
                                </div>
                                <div className='event-card-info'>
                                    <h3 className='event-card-title'>{event.title}</h3>
                                    <p className='event-card-date'>{event.date}</p>
                                    <p className='event-card-time'>{event.time}</p>
                                    <p className='event-card-location'>{event.location}</p>
                                    {event.info && <p className='event-card-extra'>{event.info}</p>}
                                    {event.eventUrl && (
                                        <span className='event-card-btn'>More Info</span>
                                    )}
                                </div>
                            </>
                        )

                        if (event.eventUrl) {
                            return (
                                <a
                                    key={event.id}
                                    href={event.eventUrl}
                                    target='_blank'
                                    rel='noreferrer'
                                    className='event-card'
                                >
                                    {CardInner}
                                </a>
                            )
                        }

                        return (
                            <div key={event.id} className='event-card event-card-no-link'>
                                {CardInner}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}