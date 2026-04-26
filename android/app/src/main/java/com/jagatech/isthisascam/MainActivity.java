package com.jagatech.isthisascam;

import androidx.activity.enableEdgeToEdge
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: android.os.Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
    }
}

public class MainActivity extends BridgeActivity {}
