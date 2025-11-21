import './Events.css'
import { Link } from 'react-router-dom'
import event3 from '../assets/Event-3.jpg'
import event2 from '../assets/Event-2.jpg'
import event1 from '../assets/Event-1.jpg'


const eventData = [
    // {
    //     id: 1,
    //     imgUrl: event1,
    //     title: "Salsa Workshops with Danny Alicea",
    //     date: "August 23, 2025",
    //     time: "1 - 5 PM",
    //     location: "11256 Cornell Park Dr #506, Blue Ash, OH",
    //     info: "Presented by Saoco Sesion & DaytOn1",
    //     eventUrl: 'https://www.facebook.com/share/p/1CForakFWs/'
    // },
    //     {
    //     id: 2,
    //     imgUrl: event2,
    //     title: "Social @ Joui Wine Bar",
    //     date: "August 25, 2025",
    //     time: "8 - 11 PM",
    //     location: "117 E 3rd St, Dayton, OH",
    //     info: "Presented by DaytOn1",
    //     eventUrl: 'https://www.facebook.com/share/p/1CForakFWs/'
    // },
    {
        id: 1,
        imgUrl: event3,
        title: "Bachata Vibes",
        date: "November 1, 2025",
        time: "8:30 PM - 12 AM",
        location: "Elegance in Dance, Dayton, OH",
        info: "Hosted by DaytOn1 feat. Amber Rose & Sagar Lalla",
        eventUrl: 'https://www.facebook.com/events/2163903027468897'
    },
]

export default function Events() {
    return (
        <div className="events-page">
            <div className='events-content'>
                <h2 className='events-header'>
                    DaytOn1 Events
                </h2>
                <h2>Nothing scheduled at this time, check back soon!</h2>
                {/* <div className='events-event1'>
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
                </div> */}
                {/* <div className='events-event2'>
                    <div className='event2-content'>
                        <div className='event2-info'>
                            <h5 className='event2-title'>{eventData[1].title}</h5>
                            <div className='event2-details'>
                                <p>{eventData[1].date}</p>
                                <p>{eventData[1].time}</p>
                                <p>{eventData[1].location}</p>
                                <p>{eventData[1].info}</p> */}
                                {/* <a href={eventData[1].eventUrl} target= 'blank'>
                                    <button>More Info</button>
                                </a> */}
                            {/* </div>
                        </div>
                        <a href={eventData[1].eventUrl} target= 'blank'>
                            <img src={eventData[1].imgUrl} alt="" />
                        </a>
                    </div>
                </div> */}
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