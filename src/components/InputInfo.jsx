import React from 'react'
import {inputExplanation} from '../inputHelp.js'
import './InputInfo.css'

// Native disclosure works with touch, keyboard and screen readers, without hover.
export default function InputInfo({field}){
 return <details className="input-info input-info-refined"><summary aria-label={`About ${field.label}`} title={`About ${field.label}`}><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="M8 7v4" strokeLinecap="round"/><circle cx="8" cy="4.7" r=".7" fill="currentColor" stroke="none"/></svg></summary><div className="input-info-content">{inputExplanation(field)}</div></details>
}
