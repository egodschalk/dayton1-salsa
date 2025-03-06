import './FAQs.css'
import React from 'react'

const faqData = [
    {
        id: 1,
        question: 'How should I dress for class?',
        answer: 'Wear comfortable clothes that you can move in. Wear comfortable clothes that you can move in. Wear comfortable clothes that you can move in. Wear comfortable clothes that you can move in',
    },
    {
        id: 1,
        question: 'How should I dress for class?',
        answer: 'Wear comfortable clothes that you can move in',
    },
    {
        id: 1,
        question: 'How should I dress for class?',
        answer: 'Wear comfortable clothes that you can move in',
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
                    // data={proj} key={proj.id}
                    <div key={index}>
                    <h5>{item.question}</h5>
                    <p>{item.answer}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}