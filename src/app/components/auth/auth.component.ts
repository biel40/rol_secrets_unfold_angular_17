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
    try {
      const localUser = this._userService.getUser();
      if (!localUser) {
        return;
      }

      const session = await this._supabaseService.getSession();
      const isSessionValid = !!session?.user && !!session?.expires_at && session.expires_at > Math.floor(Date.now() / 1000);

      if (!isSessionValid) {
        this._userService.clearUser();
        return;
      }

      this.user = session!.user;
      this._userService.setUser(this.user);

      if (this.user && this.user.email_confirmed_at) {
        const userIsInDb = await this._supabaseService.profile(this.user).then((response: any) => {
          return !response.error;
        });

        if (!userIsInDb) {
          this._displaySnackbar('No se ha podido cargar el perfil. Por favor, vuelve a iniciar sesión.', true);
          this._router.navigate(['']);
          return;
        }

        const isAdmin = this.user?.email === "dmthesecretsunfold@gmail.com";
        const redirectPath = isAdmin ? 'admin' : 'profile';
        
        const message = isAdmin
          ? 'Ya hay sesión iniciada. Redirigiendo al panel de administrador.'
          : 'Ya hay sesión iniciada. Redirigiendo a la página de perfil.';

        this._displaySnackbar(message);
        this._router.navigate([redirectPath]);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async handleLogin(): Promise<void> {
    try {
      const email = this.signInForm.value.email as string;
      const password = this.signInForm.value.password as string;

      if (email != "" && password != "") {
        const user = await this._supabaseService.signIn(email, password);

        if (user.error && user.error.message == "Invalid login credentials") {
          this._displaySnackbar("El email o la contraseña son incorrectos. Verifica tus credenciales e inténtalo de nuevo.", true);
        } else {
          this.user = user.data.user;
          this._userService.setUser(this.user);
          this._loaderService.setLoading(true);

          if (this.user && this.user.email && this.user.email_confirmed_at && this.user.email === "dmthesecretsunfold@gmail.com") {
            this._displaySnackbar('Entrando con perfil de administrador.');
            this._router.navigate(['admin']);
          } else {
            this._router.navigate(['profile']);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error: ', error);
        this._displaySnackbar(error.message, true);
      }
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
            this._displaySnackbar("Has excedido el límite de intentos de registro. Por favor, espera unos minutos antes de intentarlo de nuevo.", true);
          } else if (response.error.message == "User already registered") {
            this._displaySnackbar("Este email ya está registrado. Intenta iniciar sesión o usa otro email.", true);
          } else {
            this._displaySnackbar("Ha ocurrido un error al crear la cuenta. Por favor, inténtalo de nuevo.", true);
          }
        } else {
          this.user = response.data.user;
          this._userService.setUser(this.user);
          this._createProfile();
          this._router.navigate(['new-profile']);
        }
      });
    } else {
      this._displaySnackbar("El email y la contraseña son obligatorios para crear una cuenta.", true);
    }
  }

  private async _createProfile() {

    if (this.user) {

      const mockProfile: Profile = {
        id: this.user.id,
        username: this.user.email,
        clase: "Mago",
        power: "Pyro",
        level: 0,
        weapon: "Espada",
      };

      await this._supabaseService.insertProfile(mockProfile).then((response: any) => {
        if (response.error) {
          console.error('Ha ocurrido un error inesperado. Por favor, inténtelo de nuevo.');
          this._displaySnackbar('Ha ocurrido un error inesperado. Por favor, inténtelo de nuevo.', true);
        } else {
          console.log('Profile for user created successfully!!');
        }
      });
    }
  }

  private _displaySnackbar(message: string, isError: boolean = false): void {
    this._snackBar.open(message, 'Cerrar', {
      duration: 4000,
      panelClass: isError ? ['custom-snackbar', 'error-snackbar'] : ['custom-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }

  public ngOnDestroy(): void {
    this._loaderService.setLoading(false);
  }

}