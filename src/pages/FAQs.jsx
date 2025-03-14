import './FAQs.css'
import React from 'react'
import { useState } from 'react'
import SingleFAQ from '../components/SingleFAQ'
import {faqData} from '../components/FAQData'

export default function FAQs() {

    const [faqs, setFaqs] = useState(faqData)

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
            </div>
        </div>
    );
}