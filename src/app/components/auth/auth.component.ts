import { Component, inject, OnDestroy, OnInit } from '@angular/core'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { Router } from '@angular/router'
import { FormControl, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { User } from '@supabase/supabase-js';
import { Profile, SupabaseService } from '../../services/supabase/supabase.service';
import { MaterialModule } from '../../modules/material.module';
import { UserService } from '../../services/user/user.service';
import { LoaderService } from '../../services/loader/loader.service';
import { MatSnackBar } from '@angular/material/snack-bar';


@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
  standalone: true,
  imports: [
    MaterialModule,
    ReactiveFormsModule,
  ]
})
export class AuthComponent implements OnInit, OnDestroy {
  
  private _supabaseService: SupabaseService = inject(SupabaseService);
  protected readonly formBuilder = inject(FormBuilder);
  private _router = inject(Router);
  private _userService = inject(UserService);
  private _loaderService = inject(LoaderService);

  public loading: boolean = false;
  public displayErrorMessage: boolean = false;
  public user: User | null = null;

  public email: string = "";
  public password: string = "";

  emailFormControl = new FormControl('', [
    Validators.required,
    Validators.email
  ]);

  passwordFormControl = new FormControl('', [
    Validators.required
  ]);

  matcher = new ErrorStateMatcher();

  signInForm = this.formBuilder.group({
    email: '',
    password: ''
  });

  constructor(
    private _snackBar: MatSnackBar
  ) { 
    this._checkUserSession();
  }

  public ngOnInit(): void { 
    
  }

  private async _checkUserSession() {
    this.user = this._userService.getUser();

    if (this.user) {
      alert('Ya hay session iniciada. Redirigiendo a la página de perfil.');
      this._router.navigate(['profile']);
    }
  }

  async handleLogin(): Promise<void> {
    try {
      const email = this.signInForm.value.email as string;
      const password = this.signInForm.value.password as string;

      if (email != "" && password != "") {
        const user = await this._supabaseService.signIn(email, password);

        if (user.error && user.error.message == "Invalid login credentials") {
          this._displaySnackbar("Email or password incorrect. Please try again.");
        } else {
          this.user = user.data.user;
          this._userService.setUser(this.user);
          this._loaderService.setLoading(true);
          this._router.navigate(['profile']);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error: ', error);
        this._displaySnackbar(error.message);
      }
    } finally {
      this.signInForm.reset()
    }
  }

  public async handleSignup(): Promise<void> {
    const email = this.signInForm.value.email as string;
    const password = this.signInForm.value.password as string;

    this.email = email;
    this.password = password;

    if (email != "" && password != "") {
      this._supabaseService.signUp(email, password).then((response: any) => {
        if (response.error) {
          if (response.error.message == "Email rate limit exceeded") {
            this._displaySnackbar("Email rate limit exceeded. Please try again later.");
          } else {
            this._displaySnackbar("An error has occurred. Please try again.");
          }
        } else {
          this.user = response.data.user;
          this._userService.setUser(this.user);
          this.createProfile();
          this._router.navigate(['profile']);
        }
      });
    } else {
      this._displaySnackbar("Email and password are required.");
    }
  }

  private async createProfile() {

    if (this.user) {
      const mockProfile: Profile = {
        id: this.user.id,
        username: "Perfil de Pruebas",
        clase: "Mago",
        power: "Fuego",
        level: 0,
        weapon: "Espada",
      };

      await this._supabaseService.insertProfile(mockProfile).then((response: any) => {
        if (response.error) {
          console.error('Ha ocurrido un error inesperado. Por favor, inténtelo de nuevo.');
          this._displaySnackbar('Ha ocurrido un error inesperado. Por favor, inténtelo de nuevo.');
        } else {
          console.log('Profile for user created successfully!!');
        }
      });
    }
  }

  private _displaySnackbar(message: string) : void {
    this._snackBar.open(message, 'Cerrar', {
      duration: 4000,
    });
  }

  public ngOnDestroy(): void {
    this._loaderService.setLoading(false);
  }

}