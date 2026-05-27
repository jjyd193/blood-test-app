import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Input from './pages/Input';
import Result from './pages/Result';
import History from './pages/History';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/input" element={<Input />} />
        <Route path="/result" element={<Result />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </BrowserRouter>
  );
}
