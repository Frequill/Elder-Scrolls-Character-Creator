import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface LoadingState {
  [key: string]: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<LoadingState>({});
  private loadingState$ = this.loadingSubject.asObservable();
  
  setLoading(key: string, loading: boolean): void {
    const currentState = this.loadingSubject.value;
    const newState = { ...currentState, [key]: loading };
    
    if (!loading) {
      delete newState[key];
    }
    
    this.loadingSubject.next(newState);
  }
  
  isLoading(key: string): Observable<boolean> {
    return this.loadingState$.pipe(
      map(state => !!state[key])
    );
  }
  
  isAnyLoading(): Observable<boolean> {
    return this.loadingState$.pipe(
      map(state => Object.keys(state).length > 0)
    );
  }
  
  getLoadingKeys(): Observable<string[]> {
    return this.loadingState$.pipe(
      map(state => Object.keys(state))
    );
  }
  
  clearAllLoading(): void {
    this.loadingSubject.next({});
  }
}
