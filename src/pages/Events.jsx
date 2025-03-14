import './Events.css'
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
        info: "Presented by Brian Lugo. Live Performance by Dayton Salsa Project",
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
                {/* {faqData.map((item, index) => (
                     <div key={index} className='faqs-boxes'>
                     <h5>{item.question}</h5>
                     <p>{item.answer}</p>
                     </div>
                 ))} */}
                <div className='events-event1'>
                    <div className='event1-content'>
                        <div className='event1-info'>
                            <h5 className='event1-title'>{eventData[0].title}</h5>
                            <div className='event1-details'>
                                <p>{eventData[0].date}</p>
                                <p>{eventData[0].time}</p>
                                <p>{eventData[0].location}</p>
                                <p>{eventData[0].info}</p>
                            </div>
                        </div>
                        <img src={eventData[0].imgUrl} alt="" />
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
                            </div>
                        </div>
                        <img src={eventData[1].imgUrl} alt="" />
                    </div>
                </div>
                <div className='event3'></div>

            </div>
        </div>
    );
}