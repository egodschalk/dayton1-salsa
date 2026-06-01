import './Events.css'
import { Link } from 'react-router-dom'
import event3 from '../assets/Event-3.jpg'
import event2 from '../assets/Event-2.png'
import event1 from '../assets/Event-1.jpeg'


const eventData = [
    {
        id: 1,
        imgUrl: event1,
        title: "Silent Disco",
        date: "July 12, 2026",
        time: "5 -8 PM",
        location: "4464 Indian Ripple Rd, Beavercreek, OH",
        // info: "Presented by Saoco Sesion & DaytOn1",
        eventUrl: 'https://www.facebook.com/events/1531822261679572'
    },
    {
        id: 2,
        imgUrl: event2,
        title: "Salsa for a Cause",
        date: "May 8, 2026",
        time: "8 PM - 12 AM",
        location: "1400 E 5th St, Dayton, OH",
        info: "Proceeds Benefit: Special Olympics of Greater DaytOn",
        eventUrl: 'https://www.facebook.com/share/1JZUeD4h6z/'
    },
    // {
    //     id: 3,
    //     imgUrl: event3,
    //     title: "Bachata Vibes",
    //     date: "November 1, 2025",
    //     time: "8:30 PM - 12 AM",
    //     location: "Elegance in Dance, Dayton, OH",
    //     info: "Hosted by DaytOn1 feat. Amber Rose & Sagar Lalla",
    //     eventUrl: 'https://www.facebook.com/events/2163903027468897'
    // },
]

export default function Events() {
    return (
        <div className="events-page">
            <div className='events-content'>
                <h2 className='events-header'>
                    DaytOn1 Events
                </h2>
                {/* <h2>Nothing scheduled at this time, check back soon!</h2> */}
                <div className='events-event1'>
                    <div className='event1-content'>
                        <div className='event1-info'>
                            <h5 className='event1-title'>{eventData[0].title}</h5>
                            <div className='event1-details'>
                                <p>{eventData[0].date}</p>
                                <p>{eventData[0].time}</p>
                                <p>{eventData[0].location}</p>
                                <p>{eventData[0].info}</p>
                                <a href={eventData[0].eventUrl} target='blank'>
                                    <button>More Info</button>
                                </a>
                            </div>
                        </div>
                        <a href={eventData[0].eventUrl} target='blank'>
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
                                <a href={eventData[1].eventUrl} target='blank'>
                                    <button>More Info</button>
                                </a>
                            </div>
                        </div>
                        <a href={eventData[1].eventUrl} target='blank'>
                            <img src={eventData[1].imgUrl} alt="" />
                        </a>
                    </div>
                </div>
                {/* <div className='events-event3'>
                    <div className='event3-content'>
                        <div className='event3-info'>
                            <h5 className='event3-title'>{eventData[2].title}</h5>
                            <div className='event3-details'>
                                <p>{eventData[2].date}</p>
                                <p>{eventData[2].time}</p>
                                <p>{eventData[2].location}</p>
                                <p>{eventData[2].info}</p> */}
                {/* <a href={eventData[2].eventUrl} target= 'blank'>
                                    <button>More Info</button>
                                </a> */}
                {/* </div>
                        </div>
                        <a href={eventData[2].eventUrl} target= 'blank'>
                            <img src={eventData[2].imgUrl} alt="" />
                        </a>
                    </div>
                </div> */}
            </div>
        </div>
    );
}