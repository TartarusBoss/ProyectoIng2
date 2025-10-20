import React from 'react';
import logo from '../assets/um_logo.png';

export default function Header() {
  return (
    <div className="um-header">
      <img src={logo} alt="Universidad de Medellín" className="um-logo" />
    </div>
  );
}
