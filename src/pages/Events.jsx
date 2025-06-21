import './Events.css'
import { Link } from 'react-router-dom'
// import event1 from '../assets/Event-1.jpg'
import event2 from '../assets/Event-2.jpg'
import event1 from '../assets/Event-1.jpg'


const eventData = [
    {
        id: 1,
        imgUrl: event2,
        title: "Silent Disco: Latin Edition",
        date: "June 28, 2025",
        time: "8PM - 12AM",
        location: "OnPar Entertainment",
        info: "DaytOn1 Presents the Latin Edition Silent Disco at On Par Entertainment",
        eventUrl: 'https://www.eventbrite.com/e/dayton1-presents-the-latin-edition-silent-disco-at-on-par-entertainment-tickets-1359474929109'
    },
    {
        id: 2,
        imgUrl: event1,
        title: "Social @ Joui Wine Bar",
        date: "July 21, 2025",
        time: "8 - 11 PM",
        location: "117 E 3rd St, Dayton, OH",
        info: "Presented by DaytOn1",
        eventUrl: ''
    },
    // {
    //     id: 2,
    //     imgUrl: event3,
    //     title: "Salsa on the Square",
    //     date: "May 22, 2025",
    //     time: "6PM - 10PM",
    //     location: "520 Vine St, Cincinnati, OH",
    //     info: "DaytOn1 will be teaching May 22 & Sept 18",
    //     eventUrl: 'https://www.facebook.com/events/1976907526052415/'
    // },
]

export default function Events() {
    return (
        <div className="events-page">
            <div className='events-content'>
                <h2 className='events-header'>
                    DaytOn1 Events
                </h2>
                <div className='events-event1'>
                    <div className='event1-content'>
                        <div className='event1-info'>
                            <h5 className='event1-title'>{eventData[0].title}</h5>
                            <div className='event1-details'>
                                <p>{eventData[0].date}</p>
                                <p>{eventData[0].time}</p>
                                <p>{eventData[0].location}</p>
                                <p>{eventData[0].info}</p>
                                <a href={eventData[0].eventUrl} target= 'blank'>
                                    <button>More Info</button>
                                </a>
                            </div>
                        </div>
                        <a href={eventData[0].eventUrl} target= 'blank'>
                            <img src={eventData[0].imgUrl} alt="" />
                        </a>
                    </div>
                </div>
                <div className='events-event2'>
                    <div className='event2-content'>
                        <div className='event2-info'>
                            <h5 className='event2-title'>{eventData[1].title}</h5>
                            <div className='event2-details'>
                                <p>{eventData[1].date}</p>
                                <p>{eventData[1].time}</p>
                                <p>{eventData[1].location}</p>
                                <p>{eventData[1].info}</p>
                                {/* <a href={eventData[1].eventUrl} target= 'blank'>
                                    <button>More Info</button>
                                </a> */}
                            </div>
                        </div>
                        <a href={eventData[1].eventUrl} target= 'blank'>
                            <img src={eventData[1].imgUrl} alt="" />
                        </a>
                    </div>
                </div>
                <div className='events-event3'>
                    {/* <div className='event3-content'>
                        <div className='event3-info'>
                            <h5 className='event3-title'>{eventData[2].title}</h5>
                            <div className='event3-details'>
                                <p>{eventData[2].date}</p>
                                <p>{eventData[2].time}</p>
                                <p>{eventData[2].location}</p>
                                <p>{eventData[2].info}</p>
                                <a href={eventData[2].eventUrl} target= 'blank'>
                                    <button>More Info</button>
                                </a>
                            </div>
                        </div>
                        <a href={eventData[2].eventUrl} target= 'blank'>
                            <img src={eventData[2].imgUrl} alt="" />
                        </a>
                    </div> */}
                </div>
            </div>
        </div>
    );
}