import './FAQs.css'
import React from 'react'

const faqData = [
    {
        id: 1,
        question: 'How should I dress for class?',
        answer: 'Wear comfortable clothes that you can move in. Shoes that are a little slick on the bottom are preferable to keep your knees happy.',
    },
    {
        id: 2,
        question: 'I have to miss a class this month, can I make it up next month?',
        answer: 'All monthly fees are ONLY valid for the duration of the month that a class is purchased. Classes do not roll over to the next month.',
    },
    {
        id: 3,
        question: 'Do I need to come with a partner?',
        answer: 'No! Many students come by themselves or with friends. We rotate throughout the class to give everyone a chance to practice with a partner.',
    },
    {
        id: 4,
        question: 'What is your refund policy?',
        answer: 'All classes are non-refundable',
    },
    {
        id: 5,
        question: 'Another question?',
        answer: 'Another answer.',
    },
]

export default function FAQs() {


    return (
        <div className="faqs-page">
            <div className='faqs-header'>
                <h2>
                    Frequently Asked Questions
                </h2>
            </div>
            <div className='faqs-content'>
                {faqData.map((item, index) => (
                    <div key={index} className='faqs-boxes'>
                    <h5>{item.question}</h5>
                    <p>{item.answer}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}