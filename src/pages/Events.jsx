import './Events.css'
import { Link } from 'react-router-dom'
import event1 from '../assets/Event-1.jpeg'
import event2 from '../assets/Event-2.jpeg'

const eventData = [
    {
        id: 1,
        imgUrl: event1,
        title: "Latin Night at Joui",
        date: "March 24, 2025",
        time: "8 - 11 PM",
        location: "117 E 3rd Street, Dayton, OH",
        info: "Presented by DaytOn1",
        eventUrl: 'https://www.facebook.com/events/622783237211842/'
    },
    {
        id: 2,
        imgUrl: event2,
        title: "Salsa for a Cause",
        date: "May 9, 2025",
        time: "8PM - 12AM",
        location: "Dayton Liederkranz Turner German Club",
        info: "Presented by Brian Lugo. Live performance by Dayton Salsa Project, Salsa lesson with DaytOn1",
        eventUrl: 'https://www.facebook.com/events/2548047955404925'
    },
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
                                <a href={eventData[1].eventUrl} target= 'blank'>
                                    <button>More Info</button>
                                </a>
                            </div>
                        </div>
                        <a href={eventData[1].eventUrl} target= 'blank'>
                            <img src={eventData[1].imgUrl} alt="" />
                        </a>
                    </div>
                </div>
                <div className='events-event3'></div>

            </div>
        </div>
    );
}