import React, { useState, useEffect, useRef } from 'react';
import type { UserProfile as UserProfileType } from '../types';
import { getUserProfile, saveUserProfile } from '../services/profileService';
import { ArrowLeftIcon, UserCircleIcon } from './Icons';

interface UserProfileProps {
  onBack: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<UserProfileType>({ name: '', photo: '', dob: '', grade: '1º Ano - Ensino Médio' });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadedProfile = getUserProfile();
    if (loadedProfile) {
      setProfile(loadedProfile);
      if (loadedProfile.photo) {
        setPhotoPreview(loadedProfile.photo);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfile(prev => ({ ...prev, photo: base64String }));
        setPhotoPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveUserProfile(profile);
    alert('Perfil salvo com sucesso!');
    onBack();
  };

  const triggerFileSelect = () => fileInputRef.current?.click();
  
  const grades = ["1º Ano - Ensino Médio", "2º Ano - Ensino Médio", "3º Ano - Ensino Médio", "Outro"];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <header className="flex items-center p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
        <button onClick={onBack} className="mr-2 p-2 rounded-full hover:bg-gray-100">
          <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
        </button>
        <h1 className="font-semibold text-lg text-gray-800">Meu Perfil</h1>
      </header>

      <main className="flex-grow p-6 overflow-y-auto">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              className="hidden"
            />
            <button type="button" onClick={triggerFileSelect} className="relative group">
              {photoPreview ? (
                <img src={photoPreview} alt="Pré-visualização do perfil" className="h-28 w-28 rounded-full object-cover shadow-md" />
              ) : (
                <UserCircleIcon className="h-28 w-28 text-gray-300" />
              )}
              <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-40 flex items-center justify-center transition-opacity">
                <span className="text-white font-bold opacity-0 group-hover:opacity-100">Alterar</span>
              </div>
            </button>
            <p className="text-sm text-gray-500">Toque na imagem para alterar</p>
          </div>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              id="name"
              name="name"
              value={profile.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
            <input
              type="date"
              id="dob"
              name="dob"
              value={profile.dob}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">Série</label>
            <select
              id="grade"
              name="grade"
              value={profile.grade}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </form>
      </main>

      <footer className="p-4 bg-white border-t border-gray-200">
        <button
          type="submit"
          onClick={handleSave}
          className="w-full bg-blue-500 text-white font-semibold py-3 rounded-xl hover:bg-blue-600 transition-colors"
        >
          Salvar Perfil
        </button>
      </footer>
    </div>
  );
};

export default UserProfile;