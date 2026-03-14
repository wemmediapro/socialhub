/**
 * EXEMPLE D'UTILISATION - Ergonomie Moderne
 * 
 * Ce fichier montre comment utiliser tous les composants ergonomiques
 * dans votre application. Vous pouvez supprimer ce fichier après avoir
 * compris comment les utiliser.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/useToast';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import Breadcrumbs from './Breadcrumbs';
import Modal from './Modal';
import Tooltip from './Tooltip';
import ProgressBar from './ProgressBar';
import { Folder, Plus, Search, Settings } from 'lucide-react';

export default function ExampleErgonomie() {
  const { success, error, warning, info, ToastContainer } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, []);

  const handleAction = () => {
    success('Action réussie', 'L\'opération a été effectuée avec succès');
  };

  const handleError = () => {
    error('Erreur', 'Une erreur est survenue');
  };

  const handleWarning = () => {
    warning('Attention', 'Cette action est irréversible');
  };

  const handleInfo = () => {
    info('Information', 'Voici une information importante');
  };

  const simulateProgress = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setProgress(0);
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const simulateLoading = () => {
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    setLoading(true);
    loadingTimeoutRef.current = setTimeout(() => {
      loadingTimeoutRef.current = null;
      setLoading(false);
      success('Chargement terminé', 'Les données ont été chargées');
    }, 2000);
  };

  return (
    <div className="page-container">
      <Breadcrumbs
        items={[
          { label: 'Exemples', href: '/examples' },
          { label: 'Ergonomie' }
        ]}
      />

      <div className="page-header">
        <span className="page-badge">Exemples</span>
        <h1 className="page-title">Ergonomie Moderne</h1>
        <p className="page-subtitle">
          Exemples d'utilisation des composants ergonomiques
        </p>
      </div>

      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Loading Spinner */}
        <div className="card">
          <h3 className="section-title">Loading Spinner</h3>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <LoadingSpinner size="sm" />
            <LoadingSpinner size="md" />
            <LoadingSpinner size="lg" />
          </div>
          <button className="btn btn-primary" onClick={simulateLoading} style={{ marginTop: '1rem' }}>
            {loading ? <LoadingSpinner size="sm" /> : 'Simuler chargement'}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="card">
          <h3 className="section-title">Progress Bar</h3>
          <ProgressBar value={progress} showLabel={true} />
          <button className="btn btn-primary" onClick={simulateProgress} style={{ marginTop: '1rem' }}>
            Démarrer progression
          </button>
        </div>
      </div>

      {/* Empty State */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="section-title">Empty State</h3>
        <EmptyState
          icon={Folder}
          title="Aucun élément"
          description="Créez votre premier élément pour commencer à utiliser l'application"
          action={
            <button className="btn btn-primary">
              <Plus size={16} />
              Créer un élément
            </button>
          }
        />
      </div>

      {/* Toast Notifications */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="section-title">Toast Notifications</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-success" onClick={handleAction}>
            Success
          </button>
          <button className="btn btn-error" onClick={handleError}>
            Error
          </button>
          <button className="btn btn-warning" onClick={handleWarning}>
            Warning
          </button>
          <button className="btn btn-info" onClick={handleInfo}>
            Info
          </button>
        </div>
      </div>

      {/* Tooltips */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="section-title">Tooltips</h3>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Tooltip content="Cliquez pour rechercher" position="bottom">
            <button className="btn btn-secondary">
              <Search size={16} />
              Rechercher
            </button>
          </Tooltip>
          <Tooltip content="Ouvrir les paramètres" position="top">
            <button className="btn btn-secondary">
              <Settings size={16} />
              Paramètres
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Modal */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 className="section-title">Modal</h3>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          Ouvrir une modale
        </button>
      </div>

      {/* Skeleton Loader */}
      <div className="card">
        <h3 className="section-title">Skeleton Loader</h3>
        <div className="skeleton-card">
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div className="skeleton skeleton-avatar" />
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-text" style={{ width: '60%' }} />
              <div className="skeleton skeleton-text" style={{ width: '40%' }} />
            </div>
          </div>
          <div className="skeleton skeleton-text" style={{ width: '80%' }} />
          <div className="skeleton skeleton-text" style={{ width: '100%' }} />
          <div className="skeleton skeleton-text" style={{ width: '70%' }} />
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Exemple de Modale"
        size="md"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)}>
              Annuler
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setIsModalOpen(false);
                success('Action confirmée', 'La modale a été fermée');
              }}
            >
              Confirmer
            </button>
          </>
        }
      >
        <p>Ceci est un exemple de modale moderne avec fermeture au clavier (Escape) et clic sur l'overlay.</p>
      </Modal>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}


