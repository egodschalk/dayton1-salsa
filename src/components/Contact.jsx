import { Link, useLocation } from 'react-router-dom';
import './Contact.css'

function Contact() {

    return (
        <div className="contact-page">
            <h2 className="contact-header">Contact Us</h2>
            <div className='contact-content'>
                <div className='contact-info'>
                    <h3>Address:</h3>
                    <p>Genuine Work</p>
                    <p>15 McDonough Street</p>
                    <p>Dayton, OH 45402</p>
                    <h3>Phone (Please Text):</h3>
                    <p>858-752-2578</p>
                    <h3>Email:</h3>
                    <p>DaytOn1Salsa@gmail.com</p>
                </div>
                <div className='contact-form'>
                    <form className='form'>
                        <div className='field'>
                            <label className='label'>
                                <input type="text" className="name" name="name" placeholder="name" />
                            </label>
                        </div>
                        <div className='field'>
                            <label className='label'>
                                <input type="text" className="email" name="email" placeholder="email" />
                            </label>
                        </div>
                        <div className='field'>
                            <label className='label-message'>
                                <textarea className="message" rows="8" cols="50" placeholder="your message"></textarea>

                            </label>
                        </div>
                        <button>Contact Us</button>
                    </form>
                </div>

            </div>
        </div>
    );
}

export default Contact