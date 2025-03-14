import '../pages/FAQs.css'
import { useState } from 'react'

export default function SingleFAQ({ question, answer }) {

    const [showAnswer, setShowAnswer] = useState(false);

    return (
        <div>
            <div className='faqs-boxes' onClick={() => setShowAnswer(!showAnswer)}>
                <h5 className="faqs-question">
                    {question}
                </h5>
                {
                    showAnswer ? <button className='button-open'>+</button> : <button className='button-close'>+</button>
                }
            </div>
            {showAnswer && <p>{answer}</p>}
        </div>
    )
}