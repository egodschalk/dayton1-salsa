import './FAQs.css'
import React from 'react'
import { useState } from 'react'
import SingleFAQ from '../components/SingleFAQ'
import {faqData} from '../components/FAQData'

// const faqData = [
//     {
//         id: 1,
//         question: 'Where are you located?',
//         answer: '15 Mc Donough Street, Dayton, Ohio 45402',
//     },
//     {
//         id: 2,
//         question: 'Do you offer beginner classes?',
//         answer: 'Yes, and we also offer intermediate and advanced dance classes.  Typically, there are 2-3 classes taking place at the same time, same location, with multiple instructors teaching at the same time. This allows us to provide classes from beginner to advanced dancers in the dance style that is being taught at that time slot.',
//     },
//     {
//         id: 3,
//         question: 'What kind of shoes should I wear?',
//         answer: 'Any comfortable shoe with a smooth sole. We recommend shoes without tread and rubber soles that stick to the floor. You want to be able to turn easily.',
//     },
//     {
//         id: 4,
//         question: 'Where do I buy dance shoes?',
//         answer: 'As you become a better dancer (or if you decide to invest in a good pair of dance shoes), we recommend any of the following dance shoe brands used by many of our students:  Yami shoes, MyZiji Dance Fitness, GFranco, Very Fine, Fuego, or Taygra. Some of our students also just order from Amazon and other online stores.',
//     },
//     {
//         id: 5,
//         question: 'What clothing is recommended for dance classes?',
//         answer: 'This is more of personal preference. We do not have a dress code. Therefore, anything you feel comfortable moving and dancing in will work just fine. Some people bring an extra shirt to change into in case they sweat a lot but it is not required.',
//     },
//     {
//         id: 6,
//         question: 'What kind of dance classes does your dance company offer?',
//         answer: 'We primarily offer Salsa On1 and Bachata classes (Traditional, Modern, and Sensual). On occasion, we offer specialty classes such as Rueda de Casino, Cha Cha, Lifts and tricks, and/or other dance styles. We are always open to suggestions and happy to consider a pop-up workshop or specialty classes in that desired genre.',
//     },
//     {
//         id: 7,
//         question: 'What kind of payments do you accept?',
//         answer: 'We only take Venmo @DaytOn1Salsa, Paypal using DaytOn1.salsa@gmail.com, or cash at this time.  We do not take any other forms of payment.',
//     },
//     {
//         id: 8,
//         question: 'How do I register for classes?',
//         answer: 'For new students, message your name, cell phone number, and payment preference. If you have questions about pricing let us know. Otherwise, we will confirm once we receive your payment and personal information. You can pay ahead or pay at the door.',
//     },
//     {
//         id: 9,
//         question: 'Do you offer privates?',
//         answer: 'Privates can be arranged.  Prices vary depending on the instructor.  If you send us your name and phone number we can have someone contact you to set up an appointment.  ',
//     },
//     {
//         id: 10,
//         question: 'Do I need to come with a partner?',
//         answer: 'No! Many students come by themselves or with friends. We rotate throughout the class to give everyone a chance to practice with a partner.',
//     },
// ]

export default function FAQs() {

    const [faqs, setFaqs] = useState(faqData)
    const [showAnswer, setShowAnswer] = useState(false);

    return (
        <div className="faqs-page">
            <div className='faqs-header'>
                <h2>
                    Frequently Asked Questions
                </h2>
            </div>
            <div className='faqs-content'>
                {faqs.map((faq) => (
                    <SingleFAQ question={faq.question} answer={faq.answer} />
                ))}
                {faqData.map((faq, index) => (
                    <div key={index} className='faqs-boxes'>
                        <h5 className="faqs-question" onClick={() => setShowAnswer(!showAnswer)}>{faq.question}
                            {
                                showAnswer ? <button className='button-open'>+</button> : <button className='button-close'>+</button>
                            }

                        </h5>
                        {showAnswer && <p>{faq.answer}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}