

export class GlobalConstants
{
    public static genericError:string="quelque chose s'est mal passé. Veuillez réessayer plus tard";
    public static usernameRegex: string = "^[a-zA-Zà-ÿÀ-Ÿ\u0600-\u06FF]+[a-zA-Z0-9à-ÿÀ-Ÿ!@#\\$%\\^&\\*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?\\u0600-\\u06FF]*$";

    public static nameRegex: string = "[a-zA-Z\u0600-\u06FF ]+";
    public static emailRegex:string ="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,3}$";
    public  static contactNumberRegex:string="";
    public static error:string="error";
    public static phoneRegex = /^(?:\+|00)?\s*\d{1,3}\s*\d{1,4}\s*\d{1,4}\s*\d{1,4}$/;
}